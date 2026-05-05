const mongoose = require('mongoose');

const providerSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    cnpj: { type: String, unique: true, trim: true, sparse: true },
    email: { type: String, default: '', lowercase: true, trim: true },
    phone: { type: String, default: '' },
    specialty: { type: String, default: '' },
    status: { type: String, enum: ['ativo', 'inativo'], default: 'ativo' },
    notes: { type: String, default: '' },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

providerSchema.index({ name: 'text' });
providerSchema.index({ cnpj: 1 }, { unique: true, sparse: true });
providerSchema.index({ managerId: 1 });

module.exports = mongoose.model('Provider', providerSchema);
