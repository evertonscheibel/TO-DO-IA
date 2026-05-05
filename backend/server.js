require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const providerRoutes = require('./src/routes/providers');
const taskRoutes = require('./src/routes/tasks');
const activityRoutes = require('./src/routes/activities');
const reportRoutes = require('./src/routes/reports');
const importRoutes = require('./src/routes/import');
const quoteRoutes = require('./src/routes/quotes');
const contractRoutes = require('./src/routes/contracts');
const templateRoutes = require('./src/routes/templates');
const accessRoutes = require('./src/routes/accesses');
const aiRoutes = require('./src/routes/ai');
const knowledgeRoutes = require('./src/routes/knowledge');

const errorHandler = require('./src/middleware/errorHandler');

const app = express();

// Middleware
const allowedOrigins = [
  process.env.CORS_ORIGIN || 'http://localhost:7153',
  'http://localhost:7154',
  'http://127.0.0.1:7153',
  'http://127.0.0.1:7154',
  'http://192.168.0.181:7153',
  'http://10.1.1.129:7153'
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://192.168.')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', importRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/accesses', accessRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/knowledge', knowledgeRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, data: { status: 'running', timestamp: new Date() } });
});

// Error handler
app.use(errorHandler);

// Connect to MongoDB and start server
const PORT = process.env.PORT || 3015;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gestao-pj';

const User = require('./src/models/User');
const Task = require('./src/models/Task');
const { sendDeadlineAlert } = require('./src/helpers/emailService');

// Função para verificar prazos
const checkDeadlines = async () => {
  try {
    const now = new Date();
    const administrators = await User.find({ role: 'admin' });
    const managers = await User.find({ role: 'gestor' });
    const allStaff = [...administrators, ...managers];

    for (const staff of allStaff) {
      // Busca tarefas vencidas ou vencendo hoje associadas ao gestor
      const filter = { 
        status: { $nin: ['concluido'] },
        archived: false,
        dueDate: { $lte: now }
      };
      
      if (staff.role === 'gestor') {
        filter.managerId = staff._id;
      }

      const overdueTasks = await Task.find(filter).limit(20);
      if (overdueTasks.length > 0) {
        await sendDeadlineAlert(staff.email, staff.name, overdueTasks);
      }
    }
  } catch (err) {
    console.error('Erro ao verificar prazos:', err);
  }
};

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB conectado');
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      // Verifica prazos ao iniciar e a cada 12 horas
      checkDeadlines();
      setInterval(checkDeadlines, 12 * 60 * 60 * 1000);
    });
  })
  .catch((err) => {
    console.error('❌ Erro ao conectar no MongoDB:', err.message);
    process.exit(1);
  });
