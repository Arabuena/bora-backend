const express = require('express');
const cors = require('cors');
const path = require('path');
const healthRouter = require('./routes/health');
const authRouter = require('./routes/auth');
const ridesRouter = require('./routes/rides');

const app = express();

// Configuração do CORS
app.use(cors({
  origin: ['https://vextrix.vercel.app', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
}));

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Log de todas as requisições
app.use((req, res, next) => {
  console.log('Request:', {
    method: req.method,
    path: req.path,
    origin: req.headers.origin,
    headers: req.headers,
    body: req.body
  });
  next();
});

// Rota raiz serve a página de teste
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rotas da API
app.use('/auth', authRouter);
app.use('/health', healthRouter);
app.use('/rides', ridesRouter);

// Middleware de erro global
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Algo deu errado!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

module.exports = app; 