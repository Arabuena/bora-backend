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

    // Verifica se o usuário é o passageiro ou motorista desta corrida
    if (ride.passenger.id !== req.user.id && (!ride.driver || ride.driver.id !== req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado'
      });
    }

    res.json({
      success: true,
      ride
    });
  } catch (error) {
    console.error('Erro ao buscar status da corrida:', error);
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

// Listar corridas disponíveis para motoristas
router.get('/available', authenticateToken, async (req, res) => {
  try {
    // Busca todas as corridas com status 'searching'
    const rides = await Ride.find({ 
      status: 'searching',
      // Não mostrar corridas antigas (mais de 30 minutos)
      createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) }
    }).sort({ createdAt: -1 });

    console.log('Corridas disponíveis:', rides.length);

    res.json({
      success: true,
      rides
    });
  } catch (error) {
    console.error('Erro ao buscar corridas disponíveis:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar corridas disponíveis'
    });
  }
});

// Aceitar uma corrida
router.post('/:rideId/accept', authenticateToken, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);
    
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Corrida não encontrada'
      });
    }

    if (ride.status !== 'searching') {
      return res.status(400).json({
        success: false,
        message: 'Esta corrida não está mais disponível'
      });
    }

    // Atualiza o status e adiciona informações do motorista
    ride.status = 'accepted';
    ride.driver = {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name || 'Motorista',
      car: req.user.car || 'Veículo não especificado'
    };

    await ride.save();

    res.json({
      success: true,
      ride
    });
  } catch (error) {
    console.error('Erro ao aceitar corrida:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao aceitar corrida'
    });
  }
});

// Iniciar uma corrida
router.post('/:rideId/start', authenticateToken, async (req, res) => {
  try {
    console.log('Iniciando corrida:', req.params.rideId);
    const ride = await Ride.findById(req.params.rideId);
    
    if (!ride) {
      console.log('Corrida não encontrada');
      return res.status(404).json({
        success: false,
        message: 'Corrida não encontrada'
      });
    }

    if (ride.driver.id !== req.user.id) {
      console.log('Motorista não autorizado');
      return res.status(403).json({
        success: false,
        message: 'Não autorizado'
      });
    }

    console.log('Status anterior:', ride.status);
    ride.status = 'in_progress';
    ride.startTime = new Date();
    await ride.save();
    console.log('Status atual:', ride.status);

    res.json({
      success: true,
      ride
    });
  } catch (error) {
    console.error('Erro ao iniciar corrida:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao iniciar corrida'
    });
  }
});

// Finalizar uma corrida
router.post('/:rideId/finish', authenticateToken, async (req, res) => {
  try {
    console.log('Finalizando corrida:', req.params.rideId);
    const ride = await Ride.findById(req.params.rideId);
    
    if (!ride) {
      console.log('Corrida não encontrada');
      return res.status(404).json({
        success: false,
        message: 'Corrida não encontrada'
      });
    }

    if (ride.driver.id !== req.user.id) {
      console.log('Motorista não autorizado');
      return res.status(403).json({
        success: false,
        message: 'Não autorizado'
      });
    }

    console.log('Status anterior:', ride.status);
    ride.status = 'completed';
    ride.endTime = new Date();
    
    // Calcula o preço final
    const duration = (ride.endTime - ride.startTime) / 1000 / 60; // em minutos
    ride.actualPrice = calculateFinalPrice(ride.distance, duration);
    
    await ride.save();
    console.log('Status atual:', ride.status);

    res.json({
      success: true,
      ride
    });
  } catch (error) {
    console.error('Erro ao finalizar corrida:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao finalizar corrida'
    });
  }
});

// Função auxiliar para calcular preço final
function calculateFinalPrice(distance, duration) {
  const BASE_PRICE = 5.0;  // Taxa base
  const PRICE_PER_KM = 2.0;  // Preço por km
  const PRICE_PER_MINUTE = 0.5;  // Preço por minuto

  return BASE_PRICE + (distance * PRICE_PER_KM) + (duration * PRICE_PER_MINUTE);
}

// Adicione esta nova rota:
router.get('/driver/stats', authenticateToken, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const stats = await Ride.aggregate([
            {
                $match: {
                    'driver.id': req.user.id,
                    status: 'completed',
                    endTime: { $gte: today }
                }
            },
            {
                $group: {
                    _id: null,
                    ridesCount: { $sum: 1 },
                    earningsToday: { $sum: '$actualPrice' }
                }
            }
        ]);

        res.json({
            success: true,
            stats: stats[0] || { ridesCount: 0, earningsToday: 0 }
        });
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar estatísticas'
        });
    }
});

module.exports = router; 