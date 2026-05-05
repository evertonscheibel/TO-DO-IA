const router = require('express').Router();
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');
const { logActivity } = require('../helpers');

// All user routes require admin
router.use(auth, requireRole('admin'));

// GET /api/users
router.get('/', async (req, res, next) => {
    try {
        const { role, status, q, page = 1, limit = 50 } = req.query;
        const filter = {};
        if (role) filter.role = role;
        if (status) filter.status = status;
        if (q) {
            filter.$or = [
                { name: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [users, total] = await Promise.all([
            User.find(filter).select('-passwordHash').sort({ name: 1 }).skip(skip).limit(parseInt(limit)),
            User.countDocuments(filter)
        ]);

        res.json({ ok: true, data: { users, total, page: parseInt(page), limit: parseInt(limit) } });
    } catch (err) {
        next(err);
    }
});

// POST /api/users
router.post('/', async (req, res, next) => {
    try {
        const { name, email, phone, role, status, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ ok: false, error: 'Nome, email e senha são obrigatórios' });
        }
        if (!['admin', 'gestor'].includes(role)) {
            return res.status(400).json({ ok: false, error: 'Role deve ser admin ou gestor' });
        }

        const user = new User({ name, email, phone, role, status, passwordHash: password });
        await user.save();

        await logActivity({
            action: 'USER_CREATED',
            message: `Usuário "${name}" (${role}) criado`,
            entityType: 'user',
            entityId: user._id,
            actorId: req.user._id,
            actorRole: req.user.role
        });

        res.status(201).json({ ok: true, data: { user: user.toSafe() } });
    } catch (err) {
        next(err);
    }
});

// PATCH /api/users/:id
router.patch('/:id', async (req, res, next) => {
    try {
        const { name, email, phone, role, status } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ ok: false, error: 'Usuário não encontrado' });

        if (name) user.name = name;
        if (email) user.email = email;
        if (phone !== undefined) user.phone = phone;
        if (role) user.role = role;
        if (status) user.status = status;
        await user.save();

        await logActivity({
            action: 'USER_UPDATED',
            message: `Usuário "${user.name}" atualizado`,
            entityType: 'user',
            entityId: user._id,
            actorId: req.user._id,
            actorRole: req.user.role
        });

        res.json({ ok: true, data: { user: user.toSafe() } });
    } catch (err) {
        next(err);
    }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ ok: false, error: 'Usuário não encontrado' });

        await User.findByIdAndDelete(req.params.id);

        await logActivity({
            action: 'USER_DELETED',
            message: `Usuário "${user.name}" removido`,
            entityType: 'user',
            entityId: user._id,
            actorId: req.user._id,
            actorRole: req.user.role
        });

        res.json({ ok: true, data: { message: 'Usuário removido' } });
    } catch (err) {
        next(err);
    }
});

// PATCH /api/users/:id/reset-password
router.patch('/:id/reset-password', async (req, res, next) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ ok: false, error: 'Senha deve ter no mínimo 6 caracteres' });
        }

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ ok: false, error: 'Usuário não encontrado' });

        user.passwordHash = newPassword;
        await user.save();

        await logActivity({
            action: 'USER_PASSWORD_RESET',
            message: `Senha do usuário "${user.name}" redefinida`,
            entityType: 'user',
            entityId: user._id,
            actorId: req.user._id,
            actorRole: req.user.role
        });

        res.json({ ok: true, data: { message: 'Senha redefinida com sucesso' } });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
