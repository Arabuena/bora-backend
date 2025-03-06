const express = require('express');
const cors = require('cors');
const healthRouter = require('./routes/health');

const app = express();

// Configuração do CORS
const allowedOrigins = [
  'https://bora-frontend.vercel.app',  // Produção na Vercel
  'http://localhost:3000',             // Desenvolvimento local
  'https://bora-frontend-git-main-arabuena.vercel.app', // Preview da Vercel
  'https://bora-frontend-arabuena.vercel.app',          // Outros domínios da Vercel
  process.env.FRONTEND_URL             // URL configurável
].filter(Boolean); // Remove valores undefined/null

// Log dos origins permitidos
console.log('Allowed Origins:', allowedOrigins);

app.use(cors({
  origin: function(origin, callback) {
    // Log para debug
    console.log('Request Origin:', origin);
    
    // Permite requisições sem origin (como apps mobile ou Postman)
    if (!origin) {
      console.log('No origin provided - allowing request');
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      console.log('Origin allowed:', origin);
      callback(null, true);
    } else {
      console.warn(`Origin not allowed by CORS:`, origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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