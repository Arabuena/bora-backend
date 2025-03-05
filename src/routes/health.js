const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

router.get('/health', async (req, res) => {
  try {
    // Verifica conexão com MongoDB
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
        connected: dbState === 1
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

router.get('/test-connections', async (req, res) => {
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