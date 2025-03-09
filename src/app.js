const express = require('express');
const cors = require('cors');
const path = require('path');
const healthRouter = require('./routes/health');
const authRouter = require('./routes/auth');
const ridesRouter = require('./routes/rides');
const adminRouter = require('./routes/admin');
const messagesRouter = require('./routes/messages');

const app = express();

// Log de todas as requisições
app.use((req, res, next) => {
  console.log('Request:', {
    method: req.method,
    path: req.path,
    origin: req.headers.origin,
    headers: req.headers
  });
  next();
});

// Configuração do CORS
app.use(cors({
  origin: ['https://vextrix.vercel.app', 'http://localhost:3000', 'https://bora-backend-5agl.onrender.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas da API
app.use('/auth', authRouter);
app.use('/health', healthRouter);
app.use('/rides', ridesRouter);
app.use('/admin', adminRouter);
app.use('/messages', messagesRouter);

// Modifique a configuração de arquivos estáticos
app.use('/css', express.static(path.join(__dirname, 'public/css'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Mantenha a configuração geral de arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rota raiz serve a página de teste
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middleware de erro global
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Algo deu errado!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

module.exports = app; 