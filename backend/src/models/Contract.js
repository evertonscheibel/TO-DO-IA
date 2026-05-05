const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
    quoteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote' },
    contractNumber: { type: String, unique: true, required: true },
    clientName: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true }, // Markdown or HTML representation of the contract
    status: {
        type: String,
        enum: ['ativo', 'finalizado', 'cancelado', 'pendente-assinatura'],
        default: 'pendente-assinatura'
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

contractSchema.index({ status: 1 });
contractSchema.index({ quoteId: 1 });
contractSchema.index({ contractNumber: 1 });

module.exports = mongoose.model('Contract', contractSchema);
