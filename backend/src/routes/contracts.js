const router = require('express').Router();
const Contract = require('../models/Contract');
const Quote = require('../models/Quote');
const { auth } = require('../middleware/auth');
const { logActivity } = require('../helpers');

const { generateContractPDF } = require('../helpers/pdfHelper');

router.use(auth);

// GET /api/contracts/:id/pdf
router.get('/:id/pdf', async (req, res, next) => {
    try {
        const contract = await Contract.findById(req.params.id);
        if (!contract) return res.status(404).json({ ok: false, error: 'Contrato não encontrado' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=contrato-${contract.contractNumber}.pdf`);

        generateContractPDF(contract, res);
    } catch (err) {
        next(err);
    }
});

// GET /api/contracts
router.get('/', async (req, res, next) => {
    try {
        const query = req.user.role === 'admin' ? {} : { managerId: req.user._id };
        const contracts = await Contract.find(query).sort({ createdAt: -1 }).populate('quoteId');
        res.json({ ok: true, data: { contracts } });
    } catch (err) {
        next(err);
    }
});

// POST /api/contracts/generate-from-quote/:quoteId
// GET /api/contracts/:id
router.get('/:id', async (req, res, next) => {
    try {
        const contract = await Contract.findById(req.params.id);
        if (!contract) return res.status(404).json({ ok: false, error: 'Contrato não encontrado' });
        res.json({ ok: true, data: { contract } });
    } catch (err) {
        next(err);
    }
});

// POST /api/contracts
router.post('/', async (req, res, next) => {
    try {
        console.log('Receiving new contract data:', req.body);
        const contractData = { ...req.body };
        if (!contractData.quoteId || contractData.quoteId === '') {
            delete contractData.quoteId;
        }

        const contractCount = await Contract.countDocuments();
        const contractNumber = `CNT-${new Date().getFullYear()}-${(contractCount + 1).toString().padStart(4, '0')}`;

        const contract = await Contract.create({
            ...contractData,
            contractNumber,
            managerId: req.user._id,
            createdBy: req.user._id,
            updatedBy: req.user._id
        });

        await logActivity({
            action: 'CONTRACT_CREATED',
            message: `Contrato ${contractNumber} criado para ${contract.clientName}`,
            entityType: 'user',
            entityId: contract._id,
            actorId: req.user._id,
            actorRole: req.user.role
        });

        res.status(201).json({ ok: true, data: { contract } });
    } catch (err) {
        next(err);
    }
});

// POST /api/contracts/generate-from-quote/:quoteId
router.post('/generate-from-quote/:quoteId', async (req, res, next) => {
    try {
        const { quoteId } = req.params;
        const quote = await Quote.findById(quoteId);

        if (!quote) {
            return res.status(404).json({ ok: false, error: 'Orçamento não encontrado' });
        }

        const contractCount = await Contract.countDocuments();
        const contractNumber = `CNT-${new Date().getFullYear()}-${(contractCount + 1).toString().padStart(4, '0')}`;

        // Standard Contract Template (No AI)
        const contractContent = `
# CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE TI

**CONTRATANTE:** ${quote.clientName}
**CONTRATADA:** Gestão PJ - Serviços de TI e Infraestrutura

**OBJETO:** ${quote.title}
**DESCRIÇÃO:** ${quote.description}

**1. CLÁUSULA PRIMEIRA - DO OBJETO**
O presente contrato tem como objeto a prestação de serviços de ${quote.projectType}, conforme especificações do orçamento aprovado.

**2. CLÁUSULA SEGUNDA - DOS VALORES**
Pelo serviço prestado, o CONTRATANTE pagará à CONTRATADA a importância total de **R$ ${quote.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}**.

**3. CLÁUSULA TERCEIRA - DAS OBRIGAÇÕES**
A contratada se compromete a realizar os serviços com zelo e qualidade técnica. O contratante se compromete a fornecer os dados e acesso necessários.

**4. CLÁUSULA QUARTA - DO FORO**
Fica eleito o foro da comarca local para dirimir quaisquer dúvidas oriundas deste instrumento.

---
Data: ${new Date().toLocaleDateString('pt-BR')}
Contrato Gerado Automática pelo Sistema (Sem IA)
        `.trim();

        const contract = await Contract.create({
            quoteId,
            contractNumber,
            clientName: quote.clientName,
            title: quote.title,
            content: contractContent,
            managerId: req.user._id,
            createdBy: req.user._id,
            updatedBy: req.user._id
        });

        // Update quote status to approved/converted
        quote.status = 'aprovado';
        await quote.save();

        await logActivity({
            action: 'CONTRACT_CREATED',
            message: `Contrato ${contractNumber} gerado para ${quote.clientName}`,
            entityType: 'user',
            entityId: contract._id,
            actorId: req.user._id,
            actorRole: req.user.role
        });

        res.status(201).json({ ok: true, data: { contract } });
    } catch (err) {
        next(err);
    }
});

// PUT /api/contracts/:id
router.put('/:id', async (req, res, next) => {
    try {
        const contract = await Contract.findById(req.params.id);
        if (!contract) return res.status(404).json({ ok: false, error: 'Contrato não encontrado' });

        const updatedContract = await Contract.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedBy: req.user._id },
            { new: true }
        );

        await logActivity({
            action: 'CONTRACT_UPDATED',
            message: `Contrato ${updatedContract.contractNumber} atualizado`,
            entityType: 'user',
            entityId: updatedContract._id,
            actorId: req.user._id,
            actorRole: req.user.role
        });

        res.json({ ok: true, data: { contract: updatedContract } });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
