const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Rota de login
router.post('/login', async (req, res, next) => {
  try {
    console.log('Login attempt:', {
      body: req.body,
      headers: req.headers
    });

    const { email, password } = req.body;

    // TODO: Implementar validação real de usuário
    // Por enquanto, retorna sucesso para qualquer email/senha
    const token = jwt.sign(
      { id: 1, email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: 1,
        email,
        name: 'Usuário Teste',
        created_at: new Date()
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
});

// Rota de verificação de token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token não fornecido' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({
      success: true,
      user: decoded
    });
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Token inválido' 
    });
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