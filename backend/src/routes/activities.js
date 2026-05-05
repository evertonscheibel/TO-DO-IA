const router = require('express').Router();
const Activity = require('../models/Activity');
const Task = require('../models/Task');
const Provider = require('../models/Provider');
const { auth } = require('../middleware/auth');

router.use(auth);

// GET /api/activities
router.get('/', async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        let filter = {};

        // Gestor: only activities related to their scope using the new managerId field
        if (req.user.role === 'gestor') {
            filter = { managerId: req.user._id };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [activities, total] = await Promise.all([
            Activity.find(filter)
                .populate('actorId', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Activity.countDocuments(filter)
        ]);

        res.json({ ok: true, data: { activities, total, page: parseInt(page), limit: parseInt(limit) } });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
