const router = require('express').Router();
const Template = require('../models/Template');
const { auth } = require('../middleware/auth');
const { logActivity } = require('../helpers');

router.use(auth);

// GET /api/templates
router.get('/', async (req, res, next) => {
    try {
        const { type } = req.query;
        const query = { managerId: req.user._id };
        if (type) query.type = type;

        const templates = await Template.find(query).sort({ name: 1 });
        res.json({ ok: true, data: { templates } });
    } catch (err) {
        next(err);
    }
});

// POST /api/templates
router.post('/', async (req, res, next) => {
    try {
        const templateData = {
            ...req.body,
            managerId: req.user._id,
            createdBy: req.user._id,
            updatedBy: req.user._id
        };
        const template = await Template.create(templateData);

        await logActivity({
            action: 'TEMPLATE_CREATED',
            message: `Modelo "${template.name}" (${template.type}) criado`,
            entityType: 'user',
            entityId: template._id,
            actorId: req.user._id,
            actorRole: req.user.role
        });

        res.status(201).json({ ok: true, data: { template } });
    } catch (err) {
        next(err);
    }
});

// DELETE /api/templates/:id
router.delete('/:id', async (req, res, next) => {
    try {
        const template = await Template.findOneAndDelete({ _id: req.params.id, managerId: req.user._id });
        if (!template) return res.status(404).json({ ok: false, error: 'Modelo não encontrado' });

        await logActivity({
            action: 'TEMPLATE_DELETED',
            message: `Modelo "${template.name}" excluído`,
            entityType: 'user',
            entityId: template._id,
            actorId: req.user._id,
            actorRole: req.user.role
        });

        res.json({ ok: true, message: 'Modelo excluído com sucesso' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
