const express = require('express');
const cors = require('cors');
const healthRouter = require('./routes/health');
const authRouter = require('./routes/auth');

const app = express();

// Configuração do CORS
const corsOptions = {
  origin: function(origin, callback) {
    // Log para debug
    console.log('Request Origin:', origin);
    
    // Em desenvolvimento ou sem origin, permite
    if (process.env.NODE_ENV === 'development' || !origin) {
      return callback(null, true);
    }
    
    const allowedOrigins = [
      'https://vextrix.vercel.app',
      'https://bora-frontend.vercel.app',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`Origin blocked:`, origin);
      callback(null, true); // Temporariamente permitindo todas as origens
    }
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Aplica CORS e outros middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log de todas as requisições
app.use((req, res, next) => {
  console.log('Request:', {
    method: req.method,
    url: req.url,
    origin: req.headers.origin,
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