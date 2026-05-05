const mongoose = require('mongoose');

async function checkData() {
    try {
        await mongoose.connect('mongodb://localhost:27017/gestao-pj');
        console.log('Connected to MongoDB');

        const collections = ['users', 'tasks', 'providers', 'quotes', 'contracts'];
        for (const col of collections) {
            const count = await mongoose.connection.db.collection(col).countDocuments();
            console.log(`${col}: ${count}`);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkData();
