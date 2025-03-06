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