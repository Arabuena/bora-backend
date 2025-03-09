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

// Listar todas as corridas
router.get('/rides', authenticateAdmin, async (req, res) => {
  try {
    const rides = await Ride.find()
      .sort({ createdAt: -1 })
      .limit(100); // Limita a 100 corridas mais recentes

    res.json(rides);
  } catch (error) {
    console.error('Erro ao listar corridas:', error);
    res.status(500).json({ message: 'Erro ao listar corridas' });
  }
});

// Cancelar uma corrida
router.post('/rides/:rideId/cancel', authenticateAdmin, async (req, res) => {
  try {
    const ride = await Ride.findByIdAndUpdate(
      req.params.rideId,
      { 
        status: 'cancelled',
        cancelledBy: 'admin',
        cancelReason: req.body.reason || 'Cancelado pelo administrador',
        cancelledAt: new Date()
      },
      { new: true }
    );

    if (!ride) {
      return res.status(404).json({ message: 'Corrida não encontrada' });
    }

    res.json({ success: true, ride });
  } catch (error) {
    console.error('Erro ao cancelar corrida:', error);
    res.status(500).json({ message: 'Erro ao cancelar corrida' });
  }
});

// Obter estatísticas das corridas
router.get('/rides/stats', authenticateAdmin, async (req, res) => {
  try {
    const stats = await Ride.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$estimatedPrice' },
          avgDuration: { $avg: '$duration' }
        }
      }
    ]);

    res.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ message: 'Erro ao buscar estatísticas' });
  }
});

module.exports = router; 