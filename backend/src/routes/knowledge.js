const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Knowledge = require('../models/Knowledge');
const { auth } = require('../middleware/auth');
const { logActivity } = require('../helpers');

router.use(auth);

// Multer config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/knowledge';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/png',
        'image/jpeg',
        'image/jpg'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de arquivo não permitido. Apenas PDF, DOC, XLS e Imagens são aceitos.'), false);
    }
};

const upload = multer({ 
    storage, 
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// GET /api/knowledge
router.get('/', async (req, res, next) => {
    try {
        const { q, category } = req.query;
        const filter = {};
        
        if (category) filter.category = category;
        if (q) {
            filter.$or = [
                { title: { $regex: q, $options: 'i' } },
                { content: { $regex: q, $options: 'i' } },
                { tags: { $in: [new RegExp(q, 'i')] } }
            ];
        }

        const articles = await Knowledge.find(filter)
            .populate('createdBy', 'name')
            .sort({ updatedAt: -1 });

        res.json({ ok: true, data: { articles } });
    } catch (err) {
        next(err);
    }
});

// POST /api/knowledge
router.post('/', async (req, res, next) => {
    try {
        const { title, content, category, tags } = req.body;
        if (!title || !content) {
            return res.status(400).json({ ok: false, error: 'Título e conteúdo são obrigatórios' });
        }

        const article = await Knowledge.create({
            title,
            content,
            category: category || 'Geral',
            tags: tags || [],
            createdBy: req.user._id
        });

        await logActivity({
            action: 'KNOWLEDGE_CREATED',
            message: `Artigo "${title}" criado na base de conhecimento`,
            entityType: 'knowledge',
            entityId: article._id,
            actorId: req.user._id,
            actorRole: req.user.role
        });

        res.status(201).json({ ok: true, data: { article } });
    } catch (err) {
        next(err);
    }
});

// GET /api/knowledge/:id
router.get('/:id', async (req, res, next) => {
    try {
        const article = await Knowledge.findById(req.params.id)
            .populate('createdBy', 'name');
        
        if (!article) return res.status(404).json({ ok: false, error: 'Artigo não encontrado' });
        
        res.json({ ok: true, data: { article } });
    } catch (err) {
        next(err);
    }
});

// PATCH /api/knowledge/:id
router.patch('/:id', async (req, res, next) => {
    try {
        const article = await Knowledge.findById(req.params.id);
        if (!article) return res.status(404).json({ ok: false, error: 'Artigo não encontrado' });

        const { title, content, category, tags } = req.body;
        if (title) article.title = title;
        if (content) article.content = content;
        if (category) article.category = category;
        if (tags) article.tags = tags;

        await article.save();

        await logActivity({
            action: 'KNOWLEDGE_UPDATED',
            message: `Artigo "${article.title}" atualizado`,
            entityType: 'knowledge',
            entityId: article._id,
            actorId: req.user._id,
            actorRole: req.user.role
        });

        res.json({ ok: true, data: { article } });
    } catch (err) {
        next(err);
    }
});

// DELETE /api/knowledge/:id
router.delete('/:id', async (req, res, next) => {
    try {
        const article = await Knowledge.findById(req.params.id);
        if (!article) return res.status(404).json({ ok: false, error: 'Artigo não encontrado' });

        // Optionally delete files from disk
        if (article.attachments && article.attachments.length > 0) {
            article.attachments.forEach(att => {
                if (fs.existsSync(att.path)) {
                    fs.unlinkSync(att.path);
                }
            });
        }

        await Knowledge.findByIdAndDelete(req.params.id);

        await logActivity({
            action: 'KNOWLEDGE_DELETED',
            message: `Artigo "${article.title}" removido`,
            entityType: 'knowledge',
            entityId: article._id,
            actorId: req.user._id,
            actorRole: req.user.role
        });

        res.json({ ok: true, data: { message: 'Artigo removido' } });
    } catch (err) {
        next(err);
    }
});

// POST /api/knowledge/:id/attachments
router.post('/:id/attachments', upload.array('files', 5), async (req, res, next) => {
    try {
        const article = await Knowledge.findById(req.params.id);
        if (!article) return res.status(404).json({ ok: false, error: 'Artigo não encontrado' });

        const newAttachments = req.files.map(file => ({
            filename: file.filename,
            originalName: file.originalname,
            path: file.path,
            mimetype: file.mimetype,
            size: file.size
        }));

        article.attachments.push(...newAttachments);
        await article.save();

        res.json({ ok: true, data: { attachments: article.attachments } });
    } catch (err) {
        if (err instanceof multer.MulterError || err.message === 'Arquivos de vídeo não são permitidos') {
            return res.status(400).json({ ok: false, error: err.message });
        }
        next(err);
    }
});

// GET /api/knowledge/download/:filename
router.get('/download/:filename', async (req, res, next) => {
    try {
        const filename = path.basename(req.params.filename);
        const dir = 'uploads/knowledge';
        const filePath = path.join(dir, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ ok: false, error: 'Arquivo não encontrado' });
        }

        // Find the original name from database to serve with a nice name
        const article = await Knowledge.findOne({ 'attachments.filename': filename });
        const attachment = article ? article.attachments.find(a => a.filename === filename) : null;
        const originalName = attachment ? attachment.originalName : filename;

        res.download(filePath, originalName);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
