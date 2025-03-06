const express = require('express');
const cors = require('cors');
const healthRouter = require('./routes/health');

const app = express();

// Configuração do CORS
const allowedOrigins = [
  'https://bora-frontend.vercel.app',  // Produção na Vercel
  'http://localhost:3000',             // Desenvolvimento local
  process.env.FRONTEND_URL             // URL configurável
].filter(Boolean); // Remove valores undefined/null

app.use(cors({
  origin: function(origin, callback) {
    // Permite requisições sem origin (como apps mobile)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`Origin ${origin} não permitida pelo CORS`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
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
  console.error(err.stack);
  res.status(500).json({ message: 'Algo deu errado!' });
});

module.exports = app; 