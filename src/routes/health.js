const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Rota raiz de saúde
router.get('/', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const dbStatus = {
      0: "Desconectado",
      1: "Conectado",
      2: "Conectando",
      3: "Desconectando"
    };

    res.status(200).json({
      status: 'ok',
      database: {
        state: dbStatus[dbState],
        connected: dbState === 1,
        name: mongoose.connection.name,
        host: mongoose.connection.host
      },
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

router.get('/test', async (req, res) => {
  try {
    // Testa MongoDB
    const dbState = mongoose.connection.readyState;
    const dbStatus = {
      0: "Desconectado",
      1: "Conectado",
      2: "Conectando",
      3: "Desconectando"
    };

    res.status(200).json({
      status: 'ok',
      database: {
        state: dbStatus[dbState],
        connected: dbState === 1,
        name: mongoose.connection.name,
        host: mongoose.connection.host
      },
      server: {
        env: process.env.NODE_ENV,
        port: process.env.PORT
      },
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

module.exports = router; 