const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    action: { type: String, required: true },
    message: { type: String, required: true },
    entityType: { type: String, enum: ['task', 'provider', 'user'], required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    actorRole: { type: String, default: '' },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: { createdAt: true, updatedAt: false } });

activitySchema.index({ createdAt: -1 });
activitySchema.index({ managerId: 1 });
activitySchema.index({ actorId: 1 });
activitySchema.index({ entityType: 1 });

module.exports = mongoose.model('Activity', activitySchema);
