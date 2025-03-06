const express = require('express');
const cors = require('cors');
const healthRouter = require('./routes/health');
const authRouter = require('./routes/auth');

const app = express();

// Configuração do CORS
const corsOptions = {
  origin: function(origin, callback) {
    // Em desenvolvimento, aceita qualquer origem
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Em produção, verifica a origem
    const allowedOrigins = [
      'https://vextrix.vercel.app',
      'https://bora-frontend.vercel.app',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    // Permite requisições sem origin (Postman, etc)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`Origin blocked:`, origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};

// Aplica CORS e outros middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use('/health', healthRouter);
app.use('/auth', authRouter);

// Middleware de erro global
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({ 
    message: err.message || 'Algo deu errado!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

module.exports = app; 