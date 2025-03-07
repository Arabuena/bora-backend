const express = require('express');
const cors = require('cors');
const healthRouter = require('./routes/health');
const authRouter = require('./routes/auth');

const app = express();

// Middleware para OPTIONS
app.options('*', cors());

// Configuração do CORS
app.use(cors({
  origin: ['https://vextrix.vercel.app', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Rotas
app.use('/auth', authRouter);
app.use('/health', healthRouter);

// Middleware de erro global
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Algo deu errado!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

module.exports = app; 