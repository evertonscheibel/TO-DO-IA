const router = require('express').Router();
const Provider = require('../models/Provider');
const { auth } = require('../middleware/auth');
const { logActivity, scopeFilter } = require('../helpers');

router.use(auth);

// GET /api/providers
router.get('/', async (req, res, next) => {
    try {
        const { status, managerId, q, page = 1, limit = 50 } = req.query;
        const filter = { ...scopeFilter(req.user) };

        if (status) filter.status = status;
        // Gestor ignores managerId from query — scopeFilter already applied
        if (managerId && req.user.role === 'admin') filter.managerId = managerId;
        if (q) {
            filter.$or = [
                { name: { $regex: q, $options: 'i' } },
                { cnpj: { $regex: q, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [providers, total] = await Promise.all([
            Provider.find(filter).populate('managerId', 'name email').sort({ name: 1 }).skip(skip).limit(parseInt(limit)),
            Provider.countDocuments(filter)
        ]);

        res.json({ ok: true, data: { providers, total, page: parseInt(page), limit: parseInt(limit) } });
    } catch (err) {
        next(err);
    }
});

// POST /api/providers
router.post('/', async (req, res, next) => {
    try {
        const { name, cnpj, email, phone, specialty, status, notes, managerId } = req.body;
        if (!name) {
            return res.status(400).json({ ok: false, error: 'Nome é obrigatório' });
        }

        const data = { name, cnpj, email, phone, specialty, status, notes };
        // Admin can set managerId; Gestor always assigns self
        if (req.user.role === 'admin') {
            data.managerId = managerId || null;
        } else {
            data.managerId = req.user._id;
        }

        const provider = await Provider.create(data);

        await logActivity({
            action: 'PROVIDER_CREATED',
            message: `Contratante "${name}" ${cnpj ? `(CNPJ: ${cnpj}) ` : ''}criado`,
            entityType: 'provider',
            entityId: provider._id,
            actorId: req.user._id,
            actorRole: req.user.role
        });

        res.status(201).json({ ok: true, data: { provider } });
    } catch (err) {
        next(err);
    }
});

// GET /api/providers/:id
router.get('/:id', async (req, res, next) => {
    try {
        const filter = { _id: req.params.id, ...scopeFilter(req.user) };
        if (!provider) return res.status(404).json({ ok: false, error: 'Contratante não encontrado' });
        res.json({ ok: true, data: { provider } });
    } catch (err) {
        next(err);
    }
});

// PATCH /api/providers/:id
router.patch('/:id', async (req, res, next) => {
    try {
        const filter = { _id: req.params.id, ...scopeFilter(req.user) };
        const provider = await Provider.findOne(filter);
        if (!provider) return res.status(404).json({ ok: false, error: 'Contratante não encontrado' });

        const { name, cnpj, email, phone, specialty, status, notes, managerId } = req.body;
        if (name) provider.name = name;
        if (cnpj) provider.cnpj = cnpj;
        if (email !== undefined) provider.email = email;
        if (phone !== undefined) provider.phone = phone;
        if (specialty !== undefined) provider.specialty = specialty;
        if (status) provider.status = status;
        if (notes !== undefined) provider.notes = notes;
        // Only admin can change managerId
        if (req.user.role === 'admin' && managerId !== undefined) {
            provider.managerId = managerId || null;
        }

        await provider.save();

        await logActivity({
            action: 'PROVIDER_UPDATED',
            message: `Contratante "${provider.name}" atualizado`,
            entityType: 'provider',
            entityId: provider._id,
            actorId: req.user._id,
            actorRole: req.user.role
        });

        res.json({ ok: true, data: { provider } });
    } catch (err) {
        next(err);
    }
});

// DELETE /api/providers/:id
router.delete('/:id', async (req, res, next) => {
    try {
        const filter = { _id: req.params.id, ...scopeFilter(req.user) };
        const provider = await Provider.findOne(filter);
        if (!provider) return res.status(404).json({ ok: false, error: 'Prestador não encontrado' });

        await Provider.findByIdAndDelete(req.params.id);

        await logActivity({
            action: 'PROVIDER_DELETED',
            message: `Contratante "${provider.name}" removido`,
            entityType: 'provider',
            entityId: provider._id,
            actorId: req.user._id,
            actorRole: req.user.role
        });

        res.json({ ok: true, data: { message: 'Contratante removido' } });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
