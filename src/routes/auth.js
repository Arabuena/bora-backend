router.post('/login', async (req, res, next) => {
  try {
    console.log('Login attempt:', {
      email: req.body.email,
      headers: req.headers
    });

    // ... resto do código de login

  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
});

// Rota de teste
router.get('/test', (req, res) => {
  res.json({
    message: 'Auth route is working',
    env: process.env.NODE_ENV,
    cors: {
      enabled: process.env.CORS_ENABLED,
      frontendUrl: process.env.FRONTEND_URL
    }
  });
});

// Rota de teste CORS
router.options('/test-cors', cors()); // Habilita pre-flight para esta rota
router.get('/test-cors', (req, res) => {
  res.json({
    message: 'CORS test successful',
    origin: req.headers.origin,
    environment: {
      node_env: process.env.NODE_ENV,
      frontend_url: process.env.FRONTEND_URL,
      cors_enabled: process.env.CORS_ENABLED
    },
    headers: {
      received: req.headers
    }
  });
}); 