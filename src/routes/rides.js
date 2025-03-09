const express = require('express');
const router = express.Router();
const Ride = require('../models/Ride');
const jwt = require('jsonwebtoken');

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token não fornecido' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Solicitar uma corrida
router.post('/request', authenticateToken, async (req, res) => {
  try {
    const { origin, destination, distance, estimatedPrice, estimatedTime } = req.body;

    const ride = new Ride({
      passenger: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name || 'Passageiro'
      },
      origin,
      destination,
      distance,
      estimatedPrice,
      estimatedTime,
      status: 'searching'
    });

    await ride.save();

    res.json({
      success: true,
      ride
    });
  } catch (error) {
    console.error('Erro ao criar corrida:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao solicitar corrida'
    });
  }
});

// Obter status da corrida
router.get('/:rideId/status', authenticateToken, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);
    
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Corrida não encontrada'
      });
    }

    res.json({
      success: true,
      ride
    });
  } catch (error) {
    console.error('Erro ao buscar status:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar status da corrida'
    });
  }
});

// Cancelar corrida
router.post('/:rideId/cancel', authenticateToken, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);
    
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Corrida não encontrada'
      });
    }

    if (ride.passenger.id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado'
      });
    }

    ride.status = 'cancelled';
    await ride.save();

    res.json({
      success: true,
      ride
    });
  } catch (error) {
    console.error('Erro ao cancelar corrida:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao cancelar corrida'
    });
  }
});

module.exports = router; 