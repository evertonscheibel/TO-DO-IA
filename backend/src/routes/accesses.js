const router = require('express').Router();
const Access = require('../models/Access');
const { auth } = require('../middleware/auth');
const { logActivity, scopeFilter } = require('../helpers');
const { encrypt, decrypt } = require('../helpers/cryptoHelper');

// All access routes require authentication
router.use(auth);

// GET /api/accesses
router.get('/', async (req, res, next) => {
    try {
        const { q, category } = req.query;
        const filter = {};

        if (category) filter.category = category;
        if (q) {
            filter.$or = [
                { name: { $regex: q, $options: 'i' } },
                { url: { $regex: q, $options: 'i' } },
                { username: { $regex: q, $options: 'i' } },
                { notes: { $regex: q, $options: 'i' } }
            ];
        }

        const baseFilter = { ...filter, ...scopeFilter(req.user) };
        let accesses = await Access.find(baseFilter).sort({ name: 1 });
        
        // Decrypt passwords before sending to frontend
        accesses = accesses.map(a => {
            const obj = a.toObject();
            if (obj.password) {
                obj.password = decrypt(obj.password);
            }
            return obj;
        });

        res.json({ ok: true, data: { accesses } });
    } catch (err) {
        next(err);
    }
});

// POST /api/accesses
router.post('/', async (req, res, next) => {
    try {
        const { name, url, username, password, category, notes } = req.body;

        if (!name) {
            return res.status(400).json({ ok: false, error: 'O nome é obrigatório' });
        }

        const access = new Access({
            name,
            url,
            username,
            password: encrypt(password),
            category: category || 'Servidor',
            notes,
            createdBy: req.user._id,
            managerId: req.user.role === 'admin' ? (req.body.managerId || req.user._id) : req.user._id
        });

        await access.save();

        const responseObj = access.toObject();
        responseObj.password = decrypt(responseObj.password);

        await logActivity({
            action: 'ACCESS_CREATED',
            message: `Acesso "${name}" criado`,
            entityType: 'access',
            entityId: access._id,
            actorId: req.user._id,
            actorRole: req.user.role
        });

        res.status(201).json({ ok: true, data: { access: responseObj } });
    } catch (err) {
        next(err);
    }
});

// PATCH /api/accesses/:id
router.patch('/:id', async (req, res, next) => {
    try {
        const { name, url, username, password, category, notes } = req.body;
        const access = await Access.findById(req.params.id);

        if (!access) {
            return res.status(404).json({ ok: false, error: 'Acesso não encontrado' });
        }

        if (name) access.name = name;
        if (url !== undefined) access.url = url;
        if (username !== undefined) access.username = username;
        if (password !== undefined) access.password = encrypt(password);
        if (category) access.category = category;
        if (notes !== undefined) access.notes = notes;

        await access.save();

        const responseObj = access.toObject();
        responseObj.password = decrypt(responseObj.password);

        await logActivity({
            action: 'ACCESS_UPDATED',
            message: `Acesso "${access.name}" atualizado`,
            entityType: 'access',
            entityId: access._id,
            actorId: req.user._id,
            actorRole: req.user.role
        });

        res.json({ ok: true, data: { access: responseObj } });
    } catch (err) {
        next(err);
    }
});

// DELETE /api/accesses/:id
router.delete('/:id', async (req, res, next) => {
    try {
        const access = await Access.findById(req.params.id);

        if (!access) {
            return res.status(404).json({ ok: false, error: 'Acesso não encontrado' });
        }

        await Access.findByIdAndDelete(req.params.id);

        await logActivity({
            action: 'ACCESS_DELETED',
            message: `Acesso "${access.name}" removido`,
            entityType: 'access',
            entityId: access._id,
            actorId: req.user._id,
            actorRole: req.user.role
        });

        res.json({ ok: true, data: { message: 'Acesso removido com sucesso' } });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
