const mongoose = require('mongoose');

const knowledgeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'O título é obrigatório'],
        trim: true
    },
    content: {
        type: String,
        required: [true, 'O conteúdo é obrigatório']
    },
    category: {
        type: String,
        required: [true, 'A categoria é obrigatória'],
        default: 'Geral'
    },
    tags: [String],
    attachments: [{
        filename: String,
        originalName: String,
        path: String,
        mimetype: String,
        size: Number
    }],
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Middleware to update updatedAt on save
knowledgeSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Knowledge = mongoose.model('Knowledge', knowledgeSchema);

module.exports = Knowledge;
