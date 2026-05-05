const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ ok: false, error: 'Token de autenticação não fornecido' });
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const user = await User.findById(decoded.id).select('-passwordHash');
        
        if (!user) {
            return res.status(401).json({ ok: false, error: 'Sessão inválida: usuário não encontrado' });
        }

        if (user.status !== 'ativo') {
            return res.status(401).json({ ok: false, error: 'Acesso negado: usuário inativo' });
        }

        req.user = user;
        next();
    } catch (err) {
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return res.status(401).json({ ok: false, error: 'Token inválido ou expirado' });
        }
        next(err);
    }
};

const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ ok: false, error: 'Acesso negado' });
        }
        next();
    };
};

module.exports = { auth, requireRole };
