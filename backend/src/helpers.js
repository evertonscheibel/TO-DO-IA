const Activity = require('./models/Activity');

/**
 * Log an activity for audit/timeline.
 * @param {Object} params
 * @param {string} params.action
 * @param {string} params.message
 * @param {string} params.entityType
 * @param {ObjectId} params.entityId
 * @param {ObjectId} params.actorId
 * @param {string} params.actorRole
 * @param {ObjectId} params.managerId - optional, used for scoping
 */
async function logActivity({ action, message, entityType, entityId, actorId, actorRole, managerId }) {
    try {
        // If managerId is not provided and actor is gestor, use actorId as managerId
        const mId = managerId || (actorRole === 'gestor' ? actorId : null);
        await Activity.create({ action, message, entityType, entityId, actorId, actorRole, managerId: mId });
    } catch (err) {
        console.error('Erro ao registrar atividade:', err.message);
    }
}

/**
 * Build scope filter for queries based on user role.
 * Admin gets all, Gestor gets only their own scope.
 */
function scopeFilter(user) {
    if (user.role === 'admin') return {};
    return { managerId: user._id };
}

module.exports = { logActivity, scopeFilter };
