module.exports = (err, req, res, next) => {
    console.error('❌ Erro:', err.message || err);

    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({ ok: false, error: errors.join(', ') });
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(409).json({ ok: false, error: `Valor duplicado para o campo: ${field}` });
    }

    if (err.name === 'CastError') {
        return res.status(400).json({ ok: false, error: 'ID inválido' });
    }

    res.status(err.statusCode || 500).json({
        ok: false,
        error: err.message || 'Erro interno do servidor'
    });
};
