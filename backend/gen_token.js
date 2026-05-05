const jwt = require('jsonwebtoken');
const token = jwt.sign(
    { id: '69a1bf59fdf015dc5ef41906', role: 'admin' },
    'gestao-pj-jwt-secret-dev-2024',
    { expiresIn: '1h' }
);
console.log(token);
