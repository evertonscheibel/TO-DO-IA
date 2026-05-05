const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ ok: false, error: 'Email e senha são obrigatórios' });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(401).json({ ok: false, error: 'Credenciais inválidas' });
        }

        if (user.status === 'inativo') {
            return res.status(403).json({ ok: false, error: 'Usuário inativo' });
        }

        const valid = await user.comparePassword(password);
        if (!valid) {
            return res.status(401).json({ ok: false, error: 'Credenciais inválidas' });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ ok: true, data: { token, user: user.toSafe() } });
    } catch (err) {
        next(err);
    }
});

// GET /api/auth/me
router.get('/me', auth, (req, res) => {
    res.json({ ok: true, data: { user: req.user } });
});

module.exports = router;
