const express = require('express');
const cors = require('cors');
const healthRouter = require('./routes/health');

const app = express();

// Middlewares básicos
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'http://localhost:3000'
  ],
  credentials: true
}));
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