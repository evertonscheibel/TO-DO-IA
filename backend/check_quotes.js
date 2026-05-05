const mongoose = require('mongoose');

async function checkQuotes() {
    try {
        await mongoose.connect('mongodb://localhost:27017/gestao-pj');
        const quotes = await mongoose.connection.db.collection('quotes').find({}).toArray();
        console.log('Quote statuses:', quotes.map(q => q.status));
        await mongoose.disconnect();
    } catch (err) { console.error(err); }
}
checkQuotes();
