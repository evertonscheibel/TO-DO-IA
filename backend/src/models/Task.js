const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    priority: { type: String, enum: ['baixa', 'media', 'alta', 'urgente'], default: 'media' },
    dueDate: { type: Date, default: null },
    status: {
        type: String,
        enum: ['pendente', 'backlog', 'todo', 'em-andamento', 'revisao', 'concluido'],
        default: 'backlog'
    },
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', default: null },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    archived: { type: Boolean, default: false },
    checklists: [{
        title: { type: String, required: true },
        items: [{
            text: { type: String, required: true },
            isCompleted: { type: Boolean, default: false }
        }]
    }]
}, { timestamps: true });

taskSchema.index({ status: 1 });
taskSchema.index({ managerId: 1 });
taskSchema.index({ providerId: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ archived: 1 });

module.exports = mongoose.model('Task', taskSchema);
