const express = require('express');
const cors = require('cors');
const healthRouter = require('./routes/health');

const app = express();

// Middlewares básicos
app.use(cors({
  origin: [
    'https://bora-frontend.vercel.app',  // URL do frontend na Vercel
    'http://localhost:3000'              // URL local para desenvolvimento
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use('/', healthRouter);

// Middleware de erro global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Algo deu errado!' });
});

module.exports = app; 