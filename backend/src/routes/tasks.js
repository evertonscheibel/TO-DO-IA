const router = require('express').Router();
const Task = require('../models/Task');
const Provider = require('../models/Provider');
const { auth } = require('../middleware/auth');
const { logActivity, scopeFilter } = require('../helpers');

router.use(auth);

// GET /api/tasks
router.get('/', async (req, res, next) => {
    try {
        const { status, providerId, managerId, q, from, to, overdue, archived, page = 1, limit = 50 } = req.query;
        const filter = { ...scopeFilter(req.user) };

        // Default: only non-archived tasks. If archived='true', show only archived.
        if (archived === 'true') {
            filter.archived = true;
        } else {
            filter.archived = false;
        }

        if (status) filter.status = status;
        if (providerId) filter.providerId = providerId;
        if (managerId && req.user.role === 'admin') filter.managerId = managerId;
        if (q) {
            filter.$or = [
                { title: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } }
            ];
        }
        if (from || to) {
            filter.dueDate = {};
            if (from) filter.dueDate.$gte = new Date(from);
            if (to) filter.dueDate.$lte = new Date(to);
        }
        if (overdue === 'true') {
            filter.dueDate = { ...(filter.dueDate || {}), $lt: new Date() };
            filter.status = { $nin: ['concluido'] };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [tasks, total] = await Promise.all([
            Task.find(filter)
                .populate('providerId', 'name cnpj')
                .populate('managerId', 'name email')
                .populate('createdBy', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Task.countDocuments(filter)
        ]);

        res.json({ ok: true, data: { tasks, total, page: parseInt(page), limit: parseInt(limit) } });
    } catch (err) {
        next(err);
    }
});

// POST /api/tasks
router.post('/', async (req, res, next) => {
    try {
        const { title, description, priority, dueDate, status, providerId, managerId } = req.body;
        if (!title) {
            return res.status(400).json({ ok: false, error: 'Título é obrigatório' });
        }

        const data = {
            title,
            description,
            priority: priority || 'media',
            dueDate: dueDate || null,
            status: status || 'backlog',
            providerId: providerId || null,
            createdBy: req.user._id,
            updatedBy: req.user._id
        };

        // Set managerId based on role
        if (req.user.role === 'admin') {
            data.managerId = managerId || req.user._id;
        } else {
            data.managerId = req.user._id;
        }

        // Validate provider belongs to manager scope
        if (data.providerId && req.user.role === 'gestor') {
            const provider = await Provider.findOne({ _id: data.providerId, managerId: req.user._id });
            if (!provider) {
                return res.status(403).json({ ok: false, error: 'Prestador não pertence ao seu escopo' });
            }
        }

        const task = await Task.create(data);
        const populated = await Task.findById(task._id)
            .populate('providerId', 'name cnpj')
            .populate('managerId', 'name email');

        await logActivity({
            action: 'TASK_CREATED',
            message: `Tarefa "${title}" criada`,
            entityType: 'task',
            entityId: task._id,
            actorId: req.user._id,
            actorRole: req.user.role
        });

        res.status(201).json({ ok: true, data: { task: populated } });
    } catch (err) {
        next(err);
    }
});

// GET /api/tasks/:id
router.get('/:id', async (req, res, next) => {
    try {
        const filter = { _id: req.params.id, ...scopeFilter(req.user) };
        const task = await Task.findOne(filter)
            .populate('providerId', 'name cnpj')
            .populate('managerId', 'name email')
            .populate('createdBy', 'name');
        if (!task) return res.status(404).json({ ok: false, error: 'Tarefa não encontrada' });
        res.json({ ok: true, data: { task } });
    } catch (err) {
        next(err);
    }
});

// PATCH /api/tasks/:id
router.patch('/:id', async (req, res, next) => {
    try {
        const filter = { _id: req.params.id, ...scopeFilter(req.user) };
        const task = await Task.findOne(filter);
        if (!task) return res.status(404).json({ ok: false, error: 'Tarefa não encontrada' });

        const { title, description, priority, dueDate, status, providerId, managerId, checklists } = req.body;
        if (title) task.title = title;
        if (description !== undefined) task.description = description;
        if (priority) task.priority = priority;
        if (dueDate !== undefined) task.dueDate = dueDate;
        if (status) task.status = status;
        if (checklists !== undefined) task.checklists = checklists;
        if (providerId !== undefined) {
            if (providerId && req.user.role === 'gestor') {
                const provider = await Provider.findOne({ _id: providerId, managerId: req.user._id });
                if (!provider) {
                    return res.status(403).json({ ok: false, error: 'Prestador não pertence ao seu escopo' });
                }
            }
            task.providerId = providerId || null;
        }
        if (req.user.role === 'admin' && managerId) task.managerId = managerId;
        task.updatedBy = req.user._id;
        await task.save();

        const populated = await Task.findById(task._id)
            .populate('providerId', 'name cnpj')
            .populate('managerId', 'name email');

        await logActivity({
            action: 'TASK_UPDATED',
            message: `Tarefa "${task.title}" atualizada`,
            entityType: 'task',
            entityId: task._id,
            actorId: req.user._id,
            actorRole: req.user.role
        });

        res.json({ ok: true, data: { task: populated } });
    } catch (err) {
        next(err);
    }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res, next) => {
    try {
        const filter = { _id: req.params.id, ...scopeFilter(req.user) };
        const task = await Task.findOne(filter);
        if (!task) return res.status(404).json({ ok: false, error: 'Tarefa não encontrada' });

        await Task.findByIdAndDelete(req.params.id);

        await logActivity({
            action: 'TASK_DELETED',
            message: `Tarefa "${task.title}" removida`,
            entityType: 'task',
            entityId: task._id,
            actorId: req.user._id,
            actorRole: req.user.role
        });

        res.json({ ok: true, data: { message: 'Tarefa removida' } });
    } catch (err) {
        next(err);
    }
});

// POST /api/tasks/:id/move
router.post('/:id/move', async (req, res, next) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pendente', 'backlog', 'todo', 'em-andamento', 'revisao', 'concluido'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ ok: false, error: 'Status inválido' });
        }

        const filter = { _id: req.params.id, ...scopeFilter(req.user) };
        const task = await Task.findOne(filter);
        if (!task) return res.status(404).json({ ok: false, error: 'Tarefa não encontrada' });

        const oldStatus = task.status;
        task.status = status;
        task.updatedBy = req.user._id;
        await task.save();

        await logActivity({
            action: 'TASK_MOVED',
            message: `Tarefa "${task.title}" movida de "${oldStatus}" para "${status}"`,
            entityType: 'task',
            entityId: task._id,
            actorId: req.user._id,
            actorRole: req.user.role
        });

        const populated = await Task.findById(task._id)
            .populate('providerId', 'name cnpj')
            .populate('managerId', 'name email');

        res.json({ ok: true, data: { task: populated } });
    } catch (err) {
        next(err);
    }
});

// POST /api/tasks/:id/allocate
router.post('/:id/allocate', async (req, res, next) => {
    try {
        const { providerId, status } = req.body;
        if (!providerId) {
            return res.status(400).json({ ok: false, error: 'providerId é obrigatório' });
        }

        const filter = { _id: req.params.id, ...scopeFilter(req.user) };
        const task = await Task.findOne(filter);
        if (!task) return res.status(404).json({ ok: false, error: 'Tarefa não encontrada' });

        // Validate provider belongs to manager scope
        const provFilter = { _id: providerId };
        if (req.user.role === 'gestor') provFilter.managerId = req.user._id;
        const provider = await Provider.findOne(provFilter);
        if (!provider) {
            return res.status(403).json({ ok: false, error: 'Prestador não pertence ao seu escopo' });
        }

        task.providerId = providerId;
        task.status = status || 'backlog';
        task.updatedBy = req.user._id;
        await task.save();

        await logActivity({
            action: 'TASK_ALLOCATED',
            message: `Tarefa "${task.title}" alocada para "${provider.name}"`,
            entityType: 'task',
            entityId: task._id,
            actorId: req.user._id,
            actorRole: req.user.role
        });

        const populated = await Task.findById(task._id)
            .populate('providerId', 'name cnpj')
            .populate('managerId', 'name email');

        res.json({ ok: true, data: { task: populated } });
    } catch (err) {
        next(err);
    }
});

// POST /api/tasks/archive (Bulk archive completed tasks)
router.post('/archive', async (req, res, next) => {
    try {
        const baseFilter = { ...scopeFilter(req.user) };
        const filter = {
            ...baseFilter,
            status: 'concluido',
            archived: false
        };

        const result = await Task.updateMany(filter, {
            $set: { archived: true, updatedBy: req.user._id }
        });

        await logActivity({
            action: 'TASKS_ARCHIVED',
            message: `${result.modifiedCount} tarefas concluídas foram arquivadas`,
            entityType: 'task',
            actorId: req.user._id,
            actorRole: req.user.role
        });

        res.json({ ok: true, data: { archivedCount: result.modifiedCount } });
    } catch (err) {
        next(err);
    }
});

const { sendDeadlineAlert } = require('../helpers/emailService');

// POST /api/tasks/check-deadlines (Scan for overdue tasks and notify managers)
router.post('/check-deadlines', async (req, res, next) => {
    try {
        const now = new Date();
        const overdueTasks = await Task.find({
            dueDate: { $lt: now },
            status: { $nin: ['concluido'] },
            archived: false
        }).populate('managerId', 'name email');

        if (overdueTasks.length === 0) {
            return res.json({ ok: true, message: 'Nenhuma tarefa atrasada encontrada.' });
        }

        // Group tasks by managerId
        const managerGroups = {};
        overdueTasks.forEach(task => {
            if (task.managerId) {
                const mid = task.managerId._id.toString();
                if (!managerGroups[mid]) {
                    managerGroups[mid] = {
                        manager: task.managerId,
                        tasks: []
                    };
                }
                managerGroups[mid].tasks.push(task);
            }
        });

        // Send alerts for each manager group
        const results = [];
        for (const mid in managerGroups) {
            const group = managerGroups[mid];
            if (group.manager.email) {
                const success = await sendDeadlineAlert(group.manager.email, group.manager.name, group.tasks);
                results.push({ email: group.manager.email, success });
            }
        }

        res.json({ ok: true, data: { checked: overdueTasks.length, alertsCount: results.length, details: results } });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
