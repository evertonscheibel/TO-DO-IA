const mongoose = require('mongoose');
const Task = require('./src/models/Task');
const Provider = require('./src/models/Provider');
const Quote = require('./src/models/Quote');
const Contract = require('./src/models/Contract');

async function testReports() {
    try {
        await mongoose.connect('mongodb://localhost:27017/gestao-pj');
        console.log('--- Summary Aggregation ---');
        const stats = await Task.aggregate([
            { $facet: {
                pendentes: [{ $match: { status: { $in: ['pendente', 'backlog', 'todo'] } } }, { $count: 'count' }],
                emAndamento: [{ $match: { status: { $in: ['em-andamento', 'revisao'] } } }, { $count: 'count' }],
                concluidas: [{ $match: { status: 'concluido' } }, { $count: 'count' }]
            }}
        ]);
        console.log(JSON.stringify(stats, null, 2));

        console.log('--- Financial Aggregation ---');
        const quotesStats = await Quote.aggregate([
            { $group: { _id: '$status', total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
        ]);
        console.log(JSON.stringify(quotesStats, null, 2));

        await mongoose.disconnect();
    } catch (err) { console.error(err); }
}
testReports();
