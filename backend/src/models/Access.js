const mongoose = require('mongoose');

const accessSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    url: { type: String, trim: true, default: '' },
    username: { type: String, trim: true, default: '' },
    password: { type: String, trim: true, default: '' },
    category: { type: String, trim: true, default: 'Servidor' },
    notes: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

accessSchema.index({ name: 1 });
accessSchema.index({ category: 1 });

module.exports = mongoose.model('Access', accessSchema);
