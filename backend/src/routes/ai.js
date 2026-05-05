const router = require('express').Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Task = require('../models/Task');
const Provider = require('../models/Provider');
const Quote = require('../models/Quote');
const { auth } = require('../middleware/auth');
const { logActivity, scopeFilter } = require('../helpers');

router.use(auth);

const SYSTEM_PROMPT = `VOCÊ É: O "Cérebro Operacional" do sistema Gestão PJ.
SUA MISSÃO: Auxiliar gestores e administradores a gerir tarefas, prestadores de serviços e prazos com eficiência máxima. Você atua como um Gerente de Projetos Sênior e Analista de Dados.

--- CONTEXTO DO SISTEMA ---
Você opera sobre um banco de dados MongoDB com as seguintes entidades principais:
1. Tarefas (Tasks): Possuem título, descrição, prioridade (baixa, media, alta, urgente), status (backlog, todo, em-andamento, revisao, concluido), data de vencimento (dueDate) e checklists.
2. Prestadores (Providers): Empresas terceirizadas com nome, especialidade e avaliação de desempenho.
3. Usuários: Gestores ou Admins.

--- SUAS HABILIDADES ---

HABILIDADE 1: GERAÇÃO DE CHECKLIST INTELIGENTE ("MAGIC CHECKLIST")
Quando receber um título de tarefa ou o usuário pedir para gerar um checklist, você deve quebrar essa tarefa em passos lógicos e acionáveis.
Responda EXATAMENTE neste formato JSON (sem markdown, sem aspas de bloco de código):
{"type":"checklist","title":"Nome do Checklist","items":["Item 1","Item 2","Item 3"]}

HABILIDADE 2: INTERPRETAÇÃO DE LINGUAGEM NATURAL (NLP)
O usuário digitará uma frase solta e você deve estruturá-la para o banco de dados.
Responda EXATAMENTE neste formato JSON (sem markdown, sem aspas de bloco de código):
{"type":"task","title":"Título da tarefa","description":"Descrição detalhada","priority":"media","dueDate":null,"checklists":[]}

Para prioridades, use estritamente: 'baixa', 'media', 'alta', 'urgente'.
Para datas, use formato ISO 8601 (ex: "2026-03-07T00:00:00.000Z") ou null se não especificada.
Se o usuário mencionar "sexta-feira", "amanhã", etc., calcule a data com base na data atual que será fornecida.

HABILIDADE 3: ANÁLISE DE RISCO E RELATÓRIOS
Ao receber dados JSON de performance (tarefas concluídas vs atrasadas), você deve gerar um resumo executivo curto (máximo 2 parágrafos) identificando gargalos.
Tom de voz: Profissional, direto e baseado em dados.
Neste caso, responda em texto normal (não JSON).

--- REGRAS DE RESPOSTA (CRÍTICO) ---
1. Se a resposta for um JSON (tarefas ou checklists), retorne APENAS o JSON puro, sem blocos de código markdown, sem introduções, sem explicações. Apenas o dado bruto.
2. Se a resposta for texto de análise/conversação, responda normalmente em português brasileiro.
3. Mantenha o idioma sempre em Português Brasileiro (pt-BR).
4. Nas prioridades, use estritamente os enums: 'baixa', 'media', 'alta', 'urgente'.
5. A data atual é: {{CURRENT_DATE}}`;

// Helper: create a Gemini model instance
function getGeminiModel(systemPrompt) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY não configurada');

    const genAI = new GoogleGenerativeAI(apiKey);
    const currentDate = new Date().toISOString().split('T')[0];
    const instruction = systemPrompt.replace(/\{\{CURRENT_DATE\}\}/g, currentDate);

    return genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        systemInstruction: { parts: [{ text: instruction }] }
    });
}

// Helper: handle common AI errors
function handleAIError(err, res) {
    console.error('AI Error:', err.message);

    if (err.message && err.message.includes('429')) {
        return res.status(429).json({
            ok: false,
            error: '⏳ Limite de requisições atingido. Aguarde 30 segundos e tente novamente.'
        });
    }
    if (err.message && (err.message.includes('401') || err.message.includes('403'))) {
        return res.status(401).json({
            ok: false,
            error: '🔑 Chave da API inválida ou sem permissão. Verifique a GEMINI_API_KEY no .env.'
        });
    }
    if (err.message === 'GEMINI_API_KEY não configurada') {
        return res.status(500).json({ ok: false, error: '🔑 GEMINI_API_KEY não configurada no servidor.' });
    }
    return res.status(500).json({
        ok: false,
        error: '❌ Erro ao processar sua mensagem. Tente novamente em alguns instantes.'
    });
}

// POST /api/ai/chat
router.post('/chat', async (req, res, next) => {
    try {
        const { message } = req.body;
        if (!message || !message.trim()) {
            return res.status(400).json({ ok: false, error: 'Mensagem é obrigatória' });
        }

        const model = getGeminiModel(SYSTEM_PROMPT);
        const chat = model.startChat({ history: [] });

        const result = await chat.sendMessage(message);
        const responseText = result.response.text().trim();

        // Try to detect if it's a JSON response
        let parsedJson = null;
        let responseType = 'text';
        try {
            let cleanedText = responseText;
            if (cleanedText.startsWith('```')) {
                cleanedText = cleanedText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
            }
            parsedJson = JSON.parse(cleanedText);
            responseType = parsedJson.type || 'json';
        } catch (e) {
            // Not JSON, it's a text response
        }

        res.json({
            ok: true,
            data: {
                response: responseText,
                parsedJson,
                responseType
            }
        });
    } catch (err) {
        return handleAIError(err, res);
    }
});

// POST /api/ai/create-task - Create task from AI-generated JSON
router.post('/create-task', async (req, res, next) => {
    try {
        const { title, description, priority, dueDate, checklists } = req.body;

        if (!title) {
            return res.status(400).json({ ok: false, error: 'Título é obrigatório' });
        }

        const taskData = {
            title,
            description: description || '',
            priority: priority || 'media',
            dueDate: dueDate || null,
            status: 'backlog',
            checklists: checklists || [],
            managerId: req.user._id,
            createdBy: req.user._id,
            updatedBy: req.user._id
        };

        const task = await Task.create(taskData);
        const populated = await Task.findById(task._id)
            .populate('providerId', 'name cnpj')
            .populate('managerId', 'name email');

        await logActivity({
            action: 'TASK_CREATED',
            message: `Tarefa "${title}" criada via Assistente IA`,
            entityType: 'task',
            entityId: task._id,
            actorId: req.user._id,
            actorRole: req.user.role
        });

        res.status(201).json({ ok: true, data: { task: populated } });
    } catch (err) {
        next(err);
    }
});

// POST /api/ai/analyze-reports — Análise inteligente de relatórios
router.post('/analyze-reports', async (req, res) => {
    try {
        const scope = scopeFilter(req.user);
        const now = new Date();

        // Gather real data from DB
        const stats = await Task.aggregate([
            { $match: scope },
            {
                $facet: {
                    pendentes: [{ $match: { status: { $in: ['pendente', 'backlog', 'todo'] } } }, { $count: 'count' }],
                    emAndamento: [{ $match: { status: { $in: ['em-andamento', 'revisao'] } } }, { $count: 'count' }],
                    concluidas: [{ $match: { status: 'concluido' } }, { $count: 'count' }],
                    atrasadas: [
                        { $match: { dueDate: { $lt: now }, status: { $nin: ['concluido'] } } },
                        { $count: 'count' }
                    ]
                }
            }
        ]);

        const providerPerf = await Task.aggregate([
            { $match: { ...scope, providerId: { $ne: null } } },
            {
                $group: {
                    _id: '$providerId',
                    total: { $sum: 1 },
                    concluidas: { $sum: { $cond: [{ $eq: ['$status', 'concluido'] }, 1, 0] } },
                    atrasadas: {
                        $sum: {
                            $cond: [
                                { $and: [{ $lt: ['$dueDate', now] }, { $ne: ['$status', 'concluido'] }, { $ne: ['$dueDate', null] }] },
                                1, 0
                            ]
                        }
                    }
                }
            },
            { $lookup: { from: 'providers', localField: '_id', foreignField: '_id', as: 'info' } },
            { $unwind: '$info' },
            { $project: { name: '$info.name', total: 1, concluidas: 1, atrasadas: 1 } }
        ]);

        const reportData = {
            pendentes: stats[0].pendentes[0]?.count || 0,
            emAndamento: stats[0].emAndamento[0]?.count || 0,
            concluidas: stats[0].concluidas[0]?.count || 0,
            atrasadas: stats[0].atrasadas[0]?.count || 0,
            providers: providerPerf
        };

        const REPORT_PROMPT = `Você é um Analista Sênior de Operações. Analise os dados a seguir e gere um RELATÓRIO EXECUTIVO em português brasileiro.

DADOS DE PERFORMANCE:
${JSON.stringify(reportData, null, 2)}

INSTRUÇÕES:
1. Comece com um resumo geral da situação (máximo 3 frases).
2. Identifique GARGALOS e RISCOS com base nos dados.
3. Liste RECOMENDAÇÕES acionáveis (máximo 5 itens).
4. Se houver dados de prestadores, analise o desempenho individual.
5. Use emojis de forma profissional para destacar pontos importantes (⚠️ ✅ 🔴 📊).
6. Seja direto e objetivo. Não invente dados que não existem.
7. Formate com markdown simples (negrito, listas, etc).
A data atual é: {{CURRENT_DATE}}`;

        const model = getGeminiModel(REPORT_PROMPT);
        const result = await model.generateContent('Gere a análise dos dados fornecidos.');
        const analysis = result.response.text().trim();

        res.json({ ok: true, data: { analysis, reportData } });
    } catch (err) {
        return handleAIError(err, res);
    }
});

// POST /api/ai/generate-contract — Geração de texto de contrato com IA
router.post('/generate-contract', async (req, res) => {
    try {
        const { clientName, serviceDescription, details } = req.body;
        if (!serviceDescription) {
            return res.status(400).json({ ok: false, error: 'Descrição do serviço é obrigatória' });
        }

        const CONTRACT_PROMPT = `Você é um especialista jurídico em contratos de TI e Prestação de Serviços.
Gere um contrato profissional completo em português brasileiro baseado nas informações fornecidas.

INFORMAÇÕES:
- Cliente: ${clientName || '[A DEFINIR]'}
- Serviço: ${serviceDescription}
- Detalhes adicionais: ${details || 'Nenhum'}

INSTRUÇÕES:
1. Gere um contrato completo e profissional com todas as cláusulas essenciais.
2. Inclua: OBJETO, OBRIGAÇÕES DAS PARTES, VALORES E PAGAMENTO, VIGÊNCIA, RESCISÃO, CONFIDENCIALIDADE, FORO.
3. Use placeholders entre colchetes [VALOR], [DATA], [PRAZO] para dados não fornecidos.
4. A empresa prestadora se chama "Gestão PJ - Serviços de TI e Infraestrutura".
5. Formate com markdown (títulos com #, negrito com **, listas com -).
6. O tom deve ser formal e jurídico.

Responda com EXATAMENTE dois campos em JSON (sem blocos de código markdown):
{"title":"Título do Contrato","content":"Conteúdo completo do contrato em markdown"}`;

        const model = getGeminiModel(CONTRACT_PROMPT);
        const result = await model.generateContent('Gere o contrato conforme as instruções.');
        let responseText = result.response.text().trim();

        // Parse JSON
        let parsed;
        try {
            if (responseText.startsWith('```')) {
                responseText = responseText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
            }
            parsed = JSON.parse(responseText);
        } catch (e) {
            // If not JSON, wrap the response
            parsed = { title: `Contrato - ${serviceDescription}`, content: responseText };
        }

        res.json({ ok: true, data: parsed });
    } catch (err) {
        return handleAIError(err, res);
    }
});

// POST /api/ai/generate-quote — Geração de orçamento com IA
router.post('/generate-quote', async (req, res) => {
    try {
        const { clientName, serviceDescription, projectType } = req.body;
        if (!serviceDescription) {
            return res.status(400).json({ ok: false, error: 'Descrição do serviço é obrigatória' });
        }

        const QUOTE_PROMPT = `Você é um especialista em orçamentos de TI e Infraestrutura.
Gere um orçamento profissional em formato JSON baseado nas informações fornecidas.

INFORMAÇÕES:
- Cliente: ${clientName || '[A DEFINIR]'}
- Serviço: ${serviceDescription}
- Tipo de Projeto: ${projectType || 'ti'}

INSTRUÇÕES:
1. Gere um orçamento detalhado com itens individuais.
2. Cada item deve ter: description, quantity, unitPrice, total.
3. Use preços REALISTAS do mercado brasileiro.
4. Inclua mão de obra e materiais quando aplicável.
5. A descrição do projeto deve ser profissional e técnica.
6. Inclua justificativa técnica e especificações.

Responda EXATAMENTE neste formato JSON (sem blocos de código markdown):
{
    "title": "Título do Orçamento",
    "projectType": "${projectType || 'ti'}",
    "description": "Descrição detalhada do escopo",
    "items": [
        {"description": "Item 1", "quantity": 1, "unitPrice": 100.00, "total": 100.00}
    ],
    "technicalJustification": "Justificativa técnica do projeto",
    "technicalSpecs": "Especificações técnicas"
}`;

        const model = getGeminiModel(QUOTE_PROMPT);
        const result = await model.generateContent('Gere o orçamento conforme as instruções.');
        let responseText = result.response.text().trim();

        let parsed;
        try {
            if (responseText.startsWith('```')) {
                responseText = responseText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
            }
            parsed = JSON.parse(responseText);
        } catch (e) {
            return res.status(500).json({ ok: false, error: 'A IA não retornou um formato válido. Tente novamente.' });
        }

        res.json({ ok: true, data: parsed });
    } catch (err) {
        return handleAIError(err, res);
    }
});

// POST /api/ai/summarize-tasks — Resumo executivo de tarefas
router.post('/summarize-tasks', async (req, res) => {
    try {
        const scope = scopeFilter(req.user);
        const now = new Date();

        // Get recent tasks
        const recentTasks = await Task.find(scope)
            .sort({ updatedAt: -1 })
            .limit(30)
            .populate('providerId', 'name')
            .populate('managerId', 'name')
            .lean();

        const taskSummary = recentTasks.map(t => ({
            title: t.title,
            status: t.status,
            priority: t.priority,
            provider: t.providerId?.name || 'Sem prestador',
            dueDate: t.dueDate ? new Date(t.dueDate).toLocaleDateString('pt-BR') : 'Sem prazo',
            overdue: t.dueDate && new Date(t.dueDate) < now && t.status !== 'concluido'
        }));

        const SUMMARY_PROMPT = `Você é um Gerente de Projetos Sênior analisando o panorama de tarefas de uma empresa de TI.

TAREFAS RECENTES (últimas 30):
${JSON.stringify(taskSummary, null, 2)}

INSTRUÇÕES:
1. Gere um RESUMO EXECUTIVO curto e direto (máximo 3 parágrafos).
2. Destaque as tarefas mais URGENTES e ATRASADAS.
3. Identifique padrões (muitas tarefas no backlog? muitas atrasadas?).
4. Sugira 2-3 ações prioritárias.
5. Use emojis profissionalmente (🔴 ⚠️ ✅ 📋 🎯).
6. Responda em português brasileiro, formatado com markdown.
A data atual é: {{CURRENT_DATE}}`;

        const model = getGeminiModel(SUMMARY_PROMPT);
        const result = await model.generateContent('Gere o resumo executivo das tarefas.');
        const summary = result.response.text().trim();

        res.json({ ok: true, data: { summary, taskCount: recentTasks.length } });
    } catch (err) {
        return handleAIError(err, res);
    }
});

module.exports = router;
