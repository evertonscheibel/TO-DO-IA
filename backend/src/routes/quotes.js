const router = require('express').Router();
const Quote = require('../models/Quote');
const { auth } = require('../middleware/auth');
const { logActivity } = require('../helpers');

const { generateQuotePDF } = require('../helpers/pdfHelper');

router.use(auth);

// GET /api/quotes/:id/pdf
router.get('/:id/pdf', async (req, res, next) => {
    try {
        const quote = await Quote.findById(req.params.id);
        if (!quote) return res.status(404).json({ ok: false, error: 'Orçamento não encontrado' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=orcamento-${quote._id}.pdf`);

        generateQuotePDF(quote, res);
    } catch (err) {
        next(err);
    }
});

// GET /api/quotes
router.get('/', async (req, res, next) => {
    try {
        const query = req.user.role === 'admin' ? {} : { managerId: req.user._id };
        const quotes = await Quote.find(query).sort({ createdAt: -1 });
        res.json({ ok: true, data: { quotes } });
    } catch (err) {
        next(err);
    }
});

// GET /api/quotes/:id
router.get('/:id', async (req, res, next) => {
    try {
        const quote = await Quote.findById(req.params.id);
        if (!quote) return res.status(404).json({ ok: false, error: 'Orçamento não encontrado' });
        res.json({ ok: true, data: { quote } });
    } catch (err) {
        next(err);
    }
});

// POST /api/quotes
router.post('/', async (req, res, next) => {
    try {
        const quoteData = {
            ...req.body,
            managerId: req.user._id,
            createdBy: req.user._id,
            updatedBy: req.user._id
        };
        const quote = await Quote.create(quoteData);

        await logActivity({
            action: 'QUOTE_CREATED',
            message: `Orçamento "${quote.title}" criado para ${quote.clientName}`,
            entityType: 'user',
            entityId: quote._id,
            actorId: req.user._id,
            actorRole: req.user.role
        });

        res.status(201).json({ ok: true, data: { quote } });
    } catch (err) {
        next(err);
    }
});

// PUT /api/quotes/:id
router.put('/:id', async (req, res, next) => {
    try {
        const quote = await Quote.findById(req.params.id);
        if (!quote) return res.status(404).json({ ok: false, error: 'Orçamento não encontrado' });

        const updatedQuote = await Quote.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedBy: req.user._id },
            { new: true }
        );

        await logActivity({
            action: 'QUOTE_UPDATED',
            message: `Orçamento "${updatedQuote.title}" atualizado`,
            entityType: 'user',
            entityId: updatedQuote._id,
            actorId: req.user._id,
            actorRole: req.user.role
        });

        res.json({ ok: true, data: { quote: updatedQuote } });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
