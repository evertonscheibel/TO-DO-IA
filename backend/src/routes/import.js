const router = require('express').Router();
const mongoose = require('mongoose');
const Provider = require('../models/Provider');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const { auth, requireRole } = require('../middleware/auth');
const { logActivity } = require('../helpers');

router.use(auth, requireRole('admin'));

// POST /api/admin/import
router.post('/import', async (req, res, next) => {
    try {
        const { prestadores = [], tarefas = [], atividades = [] } = req.body;
        const idMap = {}; // old id -> new ObjectId
        let importedProviders = 0;
        let importedTasks = 0;
        let importedActivities = 0;

        // Import providers
        for (const p of prestadores) {
            const oldId = p.id || p._id;
            const existing = p.cnpj ? await Provider.findOne({ cnpj: p.cnpj }) : null;
            if (existing) {
                idMap[oldId] = existing._id;
                continue;
            }

            const provider = await Provider.create({
                name: p.name || p.nome || 'Sem nome',
                cnpj: p.cnpj || `IMPORT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                email: p.email || '',
                phone: p.phone || p.telefone || '',
                specialty: p.specialty || p.especialidade || '',
                status: p.status || 'ativo',
                notes: p.notes || p.observacoes || '',
                managerId: null
            });

            idMap[oldId] = provider._id;
            importedProviders++;
        }

        // Import tasks
        for (const t of tarefas) {
            const oldId = t.id || t._id;
            const providerId = t.providerId || t.prestadorId;
            const mappedProviderId = providerId ? (idMap[providerId] || null) : null;

            const task = await Task.create({
                title: t.title || t.titulo || 'Sem título',
                description: t.description || t.descricao || '',
                priority: t.priority || t.prioridade || 'media',
                dueDate: t.dueDate || t.prazo || null,
                status: t.status || 'pendente',
                providerId: mappedProviderId,
                managerId: req.user._id,
                createdBy: req.user._id,
                updatedBy: req.user._id
            });

            idMap[oldId] = task._id;
            importedTasks++;
        }

        // Import activities
        for (const a of atividades) {
            const entityId = a.entityId ? (idMap[a.entityId] || new mongoose.Types.ObjectId()) : new mongoose.Types.ObjectId();
            await Activity.create({
                action: a.action || a.tipo || 'IMPORT',
                message: a.message || a.mensagem || 'Atividade importada',
                entityType: a.entityType || 'task',
                entityId,
                actorId: req.user._id,
                actorRole: req.user.role
            });
            importedActivities++;
        }

        // Log import completion
        await logActivity({
            action: 'IMPORT_COMPLETED',
            message: `Importação concluída: ${importedProviders} prestadores, ${importedTasks} tarefas, ${importedActivities} atividades`,
            entityType: 'user',
            entityId: req.user._id,
            actorId: req.user._id,
            actorRole: req.user.role
        });

        res.json({
            ok: true,
            data: {
                importedProviders,
                importedTasks,
                importedActivities,
                idMap
            }
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
