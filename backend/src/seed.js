require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gestao-pj';

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Conectado ao MongoDB');

        const existing = await User.findOne({ email: 'admin@gestaopj.com' });
        if (existing) {
            console.log('ℹ️  Usuário admin já existe:', existing.email);
        } else {
            const admin = new User({
                name: 'Administrador',
                email: 'admin@gestaopj.com',
                phone: '',
                role: 'admin',
                status: 'ativo',
                passwordHash: 'Admin@123'
            });
            await admin.save();
            console.log('✅ Usuário admin criado:');
            console.log('   Email: admin@gestaopj.com');
            console.log('   Senha: Admin@123');
        }

        await mongoose.disconnect();
        console.log('✅ Seed concluído');
        process.exit(0);
    } catch (err) {
        console.error('❌ Erro no seed:', err.message);
        process.exit(1);
    }
}

seed();
