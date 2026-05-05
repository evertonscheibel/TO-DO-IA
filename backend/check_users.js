const mongoose = require('mongoose');

async function checkUsers() {
    try {
        await mongoose.connect('mongodb://localhost:27017/gestao-pj');
        const users = await mongoose.connection.db.collection('users').find({}).toArray();
        console.log('Users:', users.map(u => ({ name: u.name, role: u.role, _id: u._id })));
        await mongoose.disconnect();
    } catch (err) { console.error(err); }
}
checkUsers();
