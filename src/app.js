const express = require('express');
const cors = require('cors');
const healthRouter = require('./routes/health');
const authRouter = require('./routes/auth');

const app = express();

// Configuração do CORS
const corsOptions = {
  origin: function(origin, callback) {
    // Log do origin para debug
    console.log('Request Origin:', origin);
    
    // Em desenvolvimento, aceita qualquer origem
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Em produção, verifica a origem
    const allowedOrigins = [
      'https://vextrix.vercel.app',
      'https://bora-frontend.vercel.app',
      'https://bora-frontend-git-main-arabuena.vercel.app',
      'https://bora-frontend-arabuena.vercel.app',
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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Aplica CORS globalmente
app.use(cors(corsOptions));

// Pre-flight
app.options('*', cors(corsOptions));

// Headers de segurança
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota de teste básica
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Backend is running!',
    version: '1.0.0',
    timestamp: new Date()
  });
});

// Rotas de saúde
app.use('/health', healthRouter);
app.use('/auth', authRouter);

// Middleware de erro global
app.use((err, req, res, next) => {
  console.error('Error:', err);
  console.error('Stack:', err.stack);
  
  // Log detalhado para debug
  console.error('Request details:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body
  });

  res.status(err.status || 500).json({ 
    message: err.message || 'Algo deu errado!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

module.exports = app; 