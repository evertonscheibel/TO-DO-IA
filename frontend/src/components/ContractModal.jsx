import { useState, useEffect } from 'react';
import { X, User, FileText, Calendar, Tag, AlertCircle, Copy, Save, Sparkles, Loader2 } from 'lucide-react';
import api from '../services/api';
import templateService from '../services/templateService';

const DEFAULT_CONTRACT_TEMPLATES = {
    'prestacao_servicos': {
        name: '📝 Prestação de Serviços TI',
        title: 'Contrato de Prestação de Serviços de Tecnologia da Informação',
        content: `# CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE TI

**CONTRATANTE:** [NOME DO CLIENTE]
**CONTRATADA:** Gestão PJ - Soluções em Tecnologia

**1. OBJETO**
O presente instrumento tem como objeto a prestação de serviços técnicos de [ESPECIFICAR: Suporte/Consultoria/Infraestrutura], compreendendo o planejamento, execução e monitoramento das atividades detalhadas na proposta comercial anexa.

**2. NÍVEL DE SERVIÇO (SLA)**
A CONTRATADA compromete-se a atender aos chamados técnicos dentro dos seguintes prazos:
- **Crítico (Parada Total):** Início em até 2 horas.
- **Urgente (Impacto Parcial):** Início em até 4 horas.
- **Normal (Dúvidas/Configurações):** Início em até 12 horas.

**3. CONFIDENCIALIDADE**
Ambas as partes comprometem-se a manter sigilo absoluto sobre informações estratégicas, senhas, dados de usuários e segredos de negócio acessados durante a vigência deste contrato.

**4. VALORES E CONDIÇÕES**
Pelo serviço descrito, a CONTRATANTE pagará o valor de **R$ [VALOR]**, mediante nota fiscal, com vencimento em [DIA]. Eventuais materiais necessários serão faturados à parte.

**5. PROPRIEDADE INTELECTUAL**
Todo e qualquer código, documentação ou configuração desenvolvida especificamente para a CONTRATANTE pertencerá a esta após a quitação integral dos valores acordados.

**6. RESCISÃO**
O contrato poderá ser rescindido por conveniência mediante aviso prévio de 30 dias, sem ônus, desde que não haja pendências financeiras.

[CIDADE/ESTADO], [DATA]
`
    },
    'manutencao_mensal': {
        name: '🛠️ Manutenção Mensal (SLA)',
        title: 'Contrato de Manutenção e Suporte Mensal',
        content: `# CONTRATO DE MANUTENÇÃO E SUPORTE MENSAL

**CONTRATANTE:** [NOME DO CLIENTE]
**CONTRATADA:** Gestão PJ - Serviços de TI e Infraestrutura

**1. OBJETO**
Manutenção preventiva e corretiva dos equipamentos e sistemas, suporte remoto e presencial conforme SLA acordado.

**2. COBERTURA**
- Suporte Remoto: Ilimitado (Seg-Sex, 08h-18h)
- Visitas Presenciais: [QTD] mensais
- Tempo de Resposta: [X] horas para chamados críticos.

**3. MENSALIDADE**
O valor mensal da prestação de serviços é de R$ [VALOR], com vencimento todo dia [DIA] de cada mês.

**4. RESCISÃO**
O contrato poderá ser rescindido por qualquer uma das partes com aviso prévio de 30 dias.

**5. FORO**
Foro da comarca local.

[CIDADE/ESTADO], [DATA]`
    },
    'desenvolvimento_software': {
        name: '💻 Desenvolvimento de Software',
        title: 'Contrato de Desenvolvimento de Sistema Customizado',
        content: `# CONTRATO DE DESENVOLVIMENTO DE SOFTWARE
    
**CONTRATANTE:** [NOME DO CLIENTE]
**CONTRATADA:** Gestão PJ - Soluções em Tecnologia

**1. OBJETO**
Desenvolvimento de sistema [NOME DO SISTEMA], compreendendo as etapas de levantamento, design, codificação e implantação.

**2. PROPRIEDADE INTELECTUAL**
Após a quitação integral, a propriedade do código-fonte e direitos de uso serão transferidos à CONTRATANTE, observadas as bibliotecas de terceiros.

**3. PRAZOS E ENTREGAS**
O projeto será entregue em [X] meses, seguindo o cronograma:
- Fase 1: Levantamento e Protótipo ([DATA])
- Fase 2: Desenvolvimento Backend/Frontend ([DATA])
- Fase 3: Testes e Homologação ([DATA])

**4. VALOR E CONDIÇÕES**
O valor total é de R$ [VALOR], sendo [X]% na assinatura e o restante em parcelas mensais conforme entregas.

**5. MANUTENÇÃO**
Garantia de correção de bugs por 90 dias após a entrega final.

[CIDADE/ESTADO], [DATA]`
    },
    'consultoria_ti': {
        name: '🔍 Consultoria e Auditoria TI',
        title: 'Contrato de Consultoria Técnica e Auditoria',
        content: `# CONTRATO DE CONSULTORIA E AUDITORIA EM TI

**CONTRATANTE:** [NOME DO CLIENTE]
**CONTRATADA:** Gestão PJ - Consultoria Estratégica

**1. OBJETO**
Prestação de serviços de consultoria técnica visando [OBJETIVO: ex. segurança da informação / otimização de infraestrutura].

**2. ESCOPO**
- Diagnóstico da situação atual;
- Identificação de vulnerabilidades;
- Elaboração de Relatório Técnico de Recomendações.

**3. CONFIDENCIALIDADE**
A CONTRATADA compromete-se a manter sigilo absoluto sobre todas as informações e dados acessados durante a prestação dos serviços.

**4. HONORÁRIOS**
Investimento total de R$ [VALOR], pago conforme [FORMA DE PAGAMENTO].

[CIDADE/ESTADO], [DATA]`
    }
};

export default function ContractModal({ isOpen, onClose, onSave, contract = null }) {
    const [dbTemplates, setDbTemplates] = useState([]);
    const [aiLoading, setAiLoading] = useState(false);
    const [formData, setFormData] = useState({
        clientName: '',
        title: '',
        content: '',
        status: 'pendente-assinatura',
        startDate: new Date().toISOString().split('T')[0],
        endDate: ''
    });

    useEffect(() => {
        if (isOpen) {
            fetchTemplates();
        }
    }, [isOpen]);

    const fetchTemplates = async () => {
        try {
            const response = await templateService.getTemplates('contract');
            if (response.ok) {
                setDbTemplates(response.data.templates);
            }
        } catch (error) {
            console.error('Erro ao buscar templates de contrato:', error);
        }
    };

    useEffect(() => {
        if (contract) {
            setFormData({
                ...contract,
                startDate: contract.startDate ? new Date(contract.startDate).toISOString().split('T')[0] : '',
                endDate: contract.endDate ? new Date(contract.endDate).toISOString().split('T')[0] : ''
            });
        } else {
            setFormData({
                clientName: '',
                title: '',
                content: '',
                status: 'pendente-assinatura',
                startDate: new Date().toISOString().split('T')[0],
                endDate: ''
            });
        }
    }, [contract, isOpen]);

    if (!isOpen) return null;

    const handleApplyTemplate = (value) => {
        let template;
        if (value.startsWith('db_')) {
            const templateId = value.replace('db_', '');
            const dbTemplate = dbTemplates.find(t => t._id === templateId);
            if (dbTemplate) {
                template = {
                    title: dbTemplate.data.title,
                    content: dbTemplate.data.content
                };
            }
        } else {
            const defaultTemplate = DEFAULT_CONTRACT_TEMPLATES[value];
            if (defaultTemplate) {
                template = {
                    title: defaultTemplate.title,
                    content: defaultTemplate.content
                };
            }
        }

        if (template) {
            setFormData(prev => ({
                ...prev,
                title: template.title || prev.title,
                content: template.content || prev.content
            }));
        }
    };

    const handleSaveAsTemplate = async () => {
        const templateName = prompt('Nome para o modelo de contrato:');
        if (!templateName) return;

        try {
            const templateData = {
                name: templateName,
                type: 'contract',
                data: {
                    title: formData.title,
                    content: formData.content
                }
            };
            const response = await templateService.createTemplate(templateData);
            if (response.ok) {
                alert('Modelo de contrato salvo!');
                fetchTemplates();
            }
        } catch (error) {
            console.error('Erro ao salvar modelo de contrato:', error);
            alert('Erro ao salvar modelo');
        }
    };

    const handleGenerateWithAI = async () => {
        const desc = prompt('Descreva o serviço para o contrato (ex: "Manutenção mensal de TI para 20 estações"):');
        if (!desc) return;

        setAiLoading(true);
        try {
            const res = await api.post('/ai/generate-contract', {
                clientName: formData.clientName || '',
                serviceDescription: desc,
                details: ''
            });
            const { title, content } = res.data.data;
            setFormData(prev => ({ ...prev, title: title || prev.title, content: content || prev.content }));
        } catch (err) {
            alert('Erro ao gerar contrato com IA: ' + (err.response?.data?.error || err.message));
        } finally {
            setAiLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container modal-lg">
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        <h2 style={{ margin: 0 }}>{contract ? `Editar Contrato: ${contract.contractNumber}` : 'Novo Contrato Direto'}</h2>

                        {!contract && (
                            <div className="template-selector" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                                <Copy size={16} />
                                <select onChange={(e) => handleApplyTemplate(e.target.value)} defaultValue="" style={{ color: '#0369a1' }}>
                                    <option value="" disabled>Carregar Modelo...</option>
                                    <optgroup label="Modelos Padrão">
                                        {Object.entries(DEFAULT_CONTRACT_TEMPLATES).map(([key, t]) => (
                                            <option key={key} value={key}>{t.name}</option>
                                        ))}
                                    </optgroup>
                                    {dbTemplates.length > 0 && (
                                        <optgroup label="Meus Modelos">
                                            {dbTemplates.map(t => (
                                                <option key={t._id} value={`db_${t._id}`}>📝 {t.name}</option>
                                            ))}
                                        </optgroup>
                                    )}
                                </select>
                            </div>
                        )}

                        <button
                            type="button"
                            className="btn btn-secondary-pill btn-sm"
                            onClick={handleSaveAsTemplate}
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            <Save size={14} /> Salvar como Modelo
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={handleGenerateWithAI}
                            disabled={aiLoading}
                            style={{ whiteSpace: 'nowrap', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}
                        >
                            {aiLoading ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />} Gerar com IA
                        </button>
                    </div>
                    <button className="close-btn" onClick={onClose} style={{ marginLeft: '16px' }}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body quote-form-v2">
                    <div className="form-section">
                        <div className="section-title">
                            <User size={18} /> <span>Dados Básicos</span>
                        </div>
                        <div className="grid grid-2">
                            <div className="form-group icon-input">
                                <label>Cliente / Empresa *</label>
                                <div className="input-with-icon">
                                    <User size={16} className="field-icon" />
                                    <input
                                        type="text"
                                        value={formData.clientName}
                                        onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                                        placeholder="Ex: ACME Corp"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group icon-input">
                                <label>Título do Contrato / Objeto *</label>
                                <div className="input-with-icon">
                                    <FileText size={16} className="field-icon" />
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Ex: Manutenção Mensal TI"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="section-title">
                            <Calendar size={18} /> <span>Vigência e Status</span>
                        </div>
                        <div className="grid grid-2">
                            <div className="form-group icon-input">
                                <label>Data de Início *</label>
                                <div className="input-with-icon">
                                    <Calendar size={16} className="field-icon" />
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group icon-input">
                                <label>Data de Término (Opcional)</label>
                                <div className="input-with-icon">
                                    <Calendar size={16} className="field-icon" />
                                    <input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="form-group icon-input" style={{ marginTop: '16px' }}>
                            <label>Status do Contrato</label>
                            <div className="input-with-icon">
                                <Tag size={16} className="field-icon" />
                                <select
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="pendente-assinatura">Pendente Assinatura</option>
                                    <option value="ativo">Ativo</option>
                                    <option value="finalizado">Finalizado</option>
                                    <option value="cancelado">Cancelado</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="section-title">
                            <AlertCircle size={18} /> <span>Conteúdo do Contrato (Termos e Cláusulas)</span>
                        </div>
                        <div className="form-group">
                            <textarea
                                value={formData.content}
                                onChange={e => setFormData({ ...formData, content: e.target.value })}
                                rows={10}
                                placeholder="Descreva as cláusulas contratuais, valores e obrigações..."
                                required
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary">Salvar Contrato</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
