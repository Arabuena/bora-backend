const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Ride = require('../models/Ride');
const User = require('../models/User');

// Middleware de autenticação admin
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token não fornecido' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err || user.email !== 'admin@example.com') {
      return res.status(403).json({ success: false, message: 'Não autorizado' });
    }
    req.user = user;
    next();
  });
};

// Rota para estatísticas
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const stats = {
      activeDrivers: await User.countDocuments({ role: 'driver', status: 'active' }),
      pendingDrivers: await User.countDocuments({ role: 'driver', status: 'pending' }),
      totalPassengers: await User.countDocuments({ role: 'passenger' }),
      totalRides: await Ride.countDocuments(),
      completedRides: await Ride.countDocuments({ status: 'completed' }),
      activeRides: await Ride.countDocuments({ status: { $in: ['accepted', 'in_progress'] } })
    };

    res.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ message: 'Erro ao buscar estatísticas' });
  }
});

// Rota para listar motoristas pendentes
router.get('/pending-drivers', authenticateAdmin, async (req, res) => {
  try {
    const pendingDrivers = await User.find({ 
      role: 'driver', 
      status: 'pending' 
    }).select('-password');

    res.json(pendingDrivers);
  } catch (error) {
    console.error('Erro ao buscar motoristas pendentes:', error);
    res.status(500).json({ message: 'Erro ao buscar motoristas pendentes' });
  }
});

// Rota para aprovar motorista
router.post('/approve-driver/:id', authenticateAdmin, async (req, res) => {
  try {
    const driver = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'active' },
      { new: true }
    );

    if (!driver) {
      return res.status(404).json({ message: 'Motorista não encontrado' });
    }

    res.json({ success: true, driver });
  } catch (error) {
    console.error('Erro ao aprovar motorista:', error);
    res.status(500).json({ message: 'Erro ao aprovar motorista' });
  }
});

// Rota para rejeitar motorista
router.post('/reject-driver/:id', authenticateAdmin, async (req, res) => {
  try {
    const driver = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );

    if (!driver) {
      return res.status(404).json({ message: 'Motorista não encontrado' });
    }

    res.json({ success: true, driver });
  } catch (error) {
    console.error('Erro ao rejeitar motorista:', error);
    res.status(500).json({ message: 'Erro ao rejeitar motorista' });
  }
});

module.exports = router; 