const mongoose = require('mongoose');

async function checkTaskAssignment() {
    try {
        await mongoose.connect('mongodb://localhost:27017/gestao-pj');
        const tasks = await mongoose.connection.db.collection('tasks').find({}).toArray();
        const assignments = tasks.reduce((acc, t) => {
            const key = t.managerId ? t.managerId.toString() : 'unassigned';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
        console.log('Assignments:', assignments);
        await mongoose.disconnect();
    } catch (err) { console.error(err); }
}
checkTaskAssignment();
