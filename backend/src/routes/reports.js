const router = require('express').Router();
const Task = require('../models/Task');
const Provider = require('../models/Provider');
const Activity = require('../models/Activity');
const Access = require('../models/Access');
const Quote = require('../models/Quote');
const Contract = require('../models/Contract');
const { auth, requireRole } = require('../middleware/auth');
const { scopeFilter } = require('../helpers');

router.use(auth);

// GET /api/reports/summary
router.get('/summary', async (req, res, next) => {
    try {
        const scope = scopeFilter(req.user);
        const now = new Date();

        // Use facets to count everything in one pass
        const stats = await Task.aggregate([
            { $match: scope },
            {
                $facet: {
                    pendentes: [{ $match: { status: { $in: ['pendente', 'backlog', 'todo'] } } }, { $count: 'count' }],
                    emAndamento: [{ $match: { status: { $in: ['em-andamento', 'revisao'] } } }, { $count: 'count' }],
                    concluidas: [{ $match: { status: 'concluido' } }, { $count: 'count' }],
                    atrasadas: [
                        { $match: { dueDate: { $lt: now }, status: { $nin: ['concluido'] } } },
                        { $count: 'count' }
                    ]
                }
            }
        ]);

        const totalProvidersAtivos = await Provider.countDocuments({ ...scope, status: 'ativo' });
        const totalAccesses = await Access.countDocuments({}); // Accesses are currently not scoped in the model

        res.json({
            ok: true,
            data: {
                totalProvidersAtivos,
                totalTasksPendentes: stats[0].pendentes[0]?.count || 0,
                totalTasksEmAndamento: stats[0].emAndamento[0]?.count || 0,
                totalTasksConcluidas: stats[0].concluidas[0]?.count || 0,
                totalOverdue: stats[0].atrasadas[0]?.count || 0,
                totalAccesses
            }
        });
    } catch (err) {
        next(err);
    }
});

// GET /api/reports/financial
router.get('/financial', async (req, res, next) => {
    try {
        const scope = scopeFilter(req.user);
        
        const quotesStats = await Quote.aggregate([
            { $match: scope },
            {
                $group: {
                    _id: '$status',
                    total: { $sum: '$totalAmount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const contractsCount = await Contract.countDocuments({ ...scope, status: 'ativo' });

        res.json({
            ok: true,
            data: {
                quotes: quotesStats,
                activeContracts: contractsCount
            }
        });
    } catch (err) {
        next(err);
    }
});

// GET /api/reports/provider-performance
router.get('/provider-performance', async (req, res, next) => {
    try {
        const scope = scopeFilter(req.user);
        const now = new Date();

        // Aggregate performance for all providers in scope at once
        const performance = await Task.aggregate([
            { $match: scope },
            { $match: { providerId: { $ne: null } } },
            {
                $group: {
                    _id: '$providerId',
                    total: { $sum: 1 },
                    concluidas: {
                        $sum: { $cond: [{ $eq: ['$status', 'concluido'] }, 1, 0] }
                    },
                    atrasadas: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $lt: ['$dueDate', now] },
                                        { $ne: ['$status', 'concluido'] },
                                        { $ne: ['$dueDate', null] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'providers',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'providerInfo'
                }
            },
            { $unwind: '$providerInfo' },
            {
                $project: {
                    provider: { _id: '$providerInfo._id', name: '$providerInfo.name', cnpj: '$providerInfo.cnpj' },
                    total: 1,
                    concluidas: 1,
                    atrasadas: 1,
                    percentual: {
                        $cond: [
                            { $gt: ['$total', 0] },
                            { $round: [{ $multiply: [{ $divide: ['$concluidas', '$total'] }, 100] }] },
                            0
                        ]
                    }
                }
            },
            { $sort: { total: -1 } }
        ]);

        res.json({ ok: true, data: { performance } });
    } catch (err) {
        next(err);
    }
});

// GET /api/reports/manager-performance (admin only)
router.get('/manager-performance', requireRole('admin'), async (req, res, next) => {
    try {
        const now = new Date();
        const performance = await Task.aggregate([
            {
                $group: {
                    _id: '$managerId',
                    total: { $sum: 1 },
                    concluidas: {
                        $sum: { $cond: [{ $eq: ['$status', 'concluido'] }, 1, 0] }
                    },
                    atrasadas: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $lt: ['$dueDate', now] },
                                        { $ne: ['$status', 'concluido'] },
                                        { $ne: ['$dueDate', null] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'manager'
                }
            },
            { $unwind: '$manager' },
            {
                $project: {
                    manager: { _id: '$manager._id', name: '$manager.name', email: '$manager.email', role: '$manager.role' },
                    total: 1,
                    concluidas: 1,
                    atrasadas: 1,
                    percentual: {
                        $cond: [
                            { $gt: ['$total', 0] },
                            { $round: [{ $multiply: [{ $divide: ['$concluidas', '$total'] }, 100] }] },
                            0
                        ]
                    }
                }
            },
            { $sort: { total: -1 } }
        ]);

        res.json({ ok: true, data: { performance } });
    } catch (err) {
        next(err);
    }
});

// GET /api/reports/task-distribution
router.get('/task-distribution', async (req, res, next) => {
    try {
        const scope = scopeFilter(req.user);

        const distributionData = await Task.aggregate([
            { $match: scope },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const statuses = ['pendente', 'backlog', 'todo', 'em-andamento', 'revisao', 'concluido'];
        const distribution = statuses.map(s => {
            const row = distributionData.find(d => d._id === s);
            return { status: s, count: row ? row.count : 0 };
        });

        res.json({ ok: true, data: { distribution } });
    } catch (err) {
        next(err);
    }
});

// GET /api/reports/timeline
router.get('/timeline', async (req, res, next) => {
    try {
        const { limit = 20 } = req.query;
        let filter = {};

        if (req.user.role === 'gestor') {
            filter = { managerId: req.user._id };
        }

        const activities = await Activity.find(filter)
            .populate('actorId', 'name')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json({ ok: true, data: { activities } });
    } catch (err) {
        next(err);
    }
});

// GET /api/reports/finished-tasks
router.get('/finished-tasks', async (req, res, next) => {
    try {
        const scope = scopeFilter(req.user);
        const tasks = await Task.find({
            ...scope,
            status: 'concluido',
            archived: false
        })
        .populate('providerId', 'name')
        .populate('managerId', 'name')
        .sort({ updatedAt: -1 })
        .limit(100);

        res.json({ ok: true, data: { tasks } });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
