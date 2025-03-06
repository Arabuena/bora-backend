const express = require('express');
const cors = require('cors');
const router = express.Router();

// Rota de login
router.post('/login', async (req, res, next) => {
  try {
    console.log('Login attempt:', {
      body: req.body,
      headers: req.headers
    });

    // TODO: Implementar lógica de login
    res.json({
      success: true,
      token: 'token_temporario',
      user: {
        id: 1,
        email: req.body.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
});

// Rota de teste
router.get('/test', (req, res) => {
  res.json({
    message: 'Auth route is working',
    timestamp: new Date()
  });
});

// Rota de teste CORS
router.options('/test-cors', cors());
router.get('/test-cors', (req, res) => {
  res.json({
    message: 'CORS test successful',
    origin: req.headers.origin,
    environment: {
      node_env: process.env.NODE_ENV,
      frontend_url: process.env.FRONTEND_URL
    },
    headers: req.headers
  });
});

module.exports = router; 