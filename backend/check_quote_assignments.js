const mongoose = require('mongoose');

async function checkQuoteAssignment() {
    try {
        await mongoose.connect('mongodb://localhost:27017/gestao-pj');
        const quotes = await mongoose.connection.db.collection('quotes').find({}).toArray();
        const assignments = quotes.reduce((acc, q) => {
            const key = q.managerId ? q.managerId.toString() : 'unassigned';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
        console.log('Quote Assignments:', assignments);
        await mongoose.disconnect();
    } catch (err) { console.error(err); }
}
checkQuoteAssignment();
