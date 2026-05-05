const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
    clientName: { type: String, required: true, trim: true },
    clientContact: { type: String, trim: true },
    projectType: {
        type: String,
        enum: ['ti', 'infraestrutura', 'cabeamento', 'fibra-optica', 'outros'],
        default: 'ti'
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    items: [{
        description: { type: String, required: true },
        quantity: { type: Number, default: 1 },
        unitPrice: { type: Number, required: true },
        total: { type: Number, required: true }
    }],
    totalAmount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['rascunho', 'enviado', 'aprovado', 'rejeitado', 'cancelado'],
        default: 'rascunho'
    },
    technicalJustification: { type: String, default: '' },
    technicalSpecs: { type: String, default: '' },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

quoteSchema.index({ status: 1 });
quoteSchema.index({ clientName: 1 });
quoteSchema.index({ managerId: 1 });

module.exports = mongoose.model('Quote', quoteSchema);
