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
    const { reason } = req.body;
    const ride = await Ride.findById(req.params.rideId);
    
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Corrida não encontrada'
      });
    }

    // Verifica se é o passageiro ou motorista
    const isPassenger = ride.passenger.id === req.user.id;
    const isDriver = ride.driver?.id === req.user.id;

    if (!isPassenger && !isDriver) {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado'
      });
    }

    // Verifica se a corrida ainda pode ser cancelada
    const uncancelableStatuses = ['completed', 'cancelled'];
    if (uncancelableStatuses.includes(ride.status)) {
      return res.status(400).json({
        success: false,
        message: 'Esta corrida não pode mais ser cancelada'
      });
    }

    // Aplica penalidade se o cancelamento for após certo tempo
    let penalty = 0;
    if (ride.status === 'in_progress') {
      penalty = calculateCancellationPenalty(ride);
    }

    // Atualiza o status da corrida
    ride.status = 'cancelled';
    ride.cancelReason = reason || 'Cancelado pelo usuário';
    ride.cancelledBy = isPassenger ? 'passenger' : 'driver';
    ride.cancelledAt = new Date();
    ride.cancellationPenalty = penalty;

    await ride.save();

    res.json({
      success: true,
      ride,
      penalty
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

// Atualizar localização do motorista
router.post('/:rideId/location', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const ride = await Ride.findById(req.params.rideId);

    if (!ride || ride.driver.id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado'
      });
    }

    ride.driverLocation = {
      latitude,
      longitude,
      updatedAt: new Date()
    };

    await ride.save();

    res.json({
      success: true,
      location: ride.driverLocation
    });
  } catch (error) {
    console.error('Erro ao atualizar localização:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar localização'
    });
  }
});

// Obter detalhes completos da corrida
router.get('/:rideId/details', authenticateToken, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Corrida não encontrada'
      });
    }

    // Verifica permissão
    if (ride.passenger.id !== req.user.id && ride.driver?.id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado'
      });
    }

    // Adiciona informações de tempo estimado se o motorista estiver a caminho
    if (ride.status === 'accepted' && ride.driverLocation) {
      ride.estimatedArrival = await calculateETA(ride.driverLocation, ride.origin);
    }

    res.json({
      success: true,
      ride
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes da corrida:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar detalhes da corrida'
    });
  }
});

// Confirmar chegada do motorista
router.post('/:rideId/arrived', authenticateToken, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);

    if (!ride || ride.driver.id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado'
      });
    }

    ride.driverArrived = true;
    ride.arrivedAt = new Date();
    await ride.save();

    res.json({
      success: true,
      ride
    });
  } catch (error) {
    console.error('Erro ao confirmar chegada:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao confirmar chegada'
    });
  }
});

// Confirmar embarque do passageiro
router.post('/:rideId/pickup', authenticateToken, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);

    if (!ride || ride.driver.id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado'
      });
    }

    ride.status = 'in_progress';
    ride.startTime = new Date();
    await ride.save();

    res.json({
      success: true,
      ride
    });
  } catch (error) {
    console.error('Erro ao confirmar embarque:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao confirmar embarque'
    });
  }
});

// Avaliar corrida (para passageiro e motorista)
router.post('/:rideId/rate', authenticateToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const ride = await Ride.findById(req.params.rideId);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Corrida não encontrada'
      });
    }

    // Verifica se é passageiro ou motorista
    const isPassenger = ride.passenger.id === req.user.id;
    const isDriver = ride.driver?.id === req.user.id;

    if (!isPassenger && !isDriver) {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado'
      });
    }

    // Atualiza a avaliação correspondente
    if (isPassenger) {
      ride.rating.driver = rating;
    } else {
      ride.rating.passenger = rating;
    }
    
    if (comment) {
      ride.rating.comment = comment;
    }

    await ride.save();

    res.json({
      success: true,
      ride
    });
  } catch (error) {
    console.error('Erro ao avaliar corrida:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao avaliar corrida'
    });
  }
});

// Confirmar código da corrida (segurança adicional)
router.post('/:rideId/verify-code', authenticateToken, async (req, res) => {
  try {
    const { code } = req.body;
    const ride = await Ride.findById(req.params.rideId);

    if (!ride || ride.driver.id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado'
      });
    }

    if (ride.verificationCode !== code) {
      return res.status(400).json({
        success: false,
        message: 'Código inválido'
      });
    }

    ride.codeVerified = true;
    await ride.save();

    res.json({
      success: true,
      ride
    });
  } catch (error) {
    console.error('Erro ao verificar código:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar código'
    });
  }
});

// Atualizar status da corrida em tempo real
router.post('/:rideId/status-update', authenticateToken, async (req, res) => {
  try {
    const { status, currentLocation } = req.body;
    const ride = await Ride.findById(req.params.rideId);

    if (!ride || ride.driver.id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado'
      });
    }

    // Atualiza status e localização
    ride.status = status;
    if (currentLocation) {
      ride.driverLocation = {
        ...currentLocation,
        updatedAt: new Date()
      };
    }

    // Adiciona timestamps específicos baseados no status
    switch (status) {
      case 'arrived':
        ride.arrivedAt = new Date();
        break;
      case 'in_progress':
        ride.startTime = new Date();
        break;
      case 'completed':
        ride.endTime = new Date();
        ride.duration = (ride.endTime - ride.startTime) / 1000; // duração em segundos
        break;
    }

    await ride.save();

    // Calcula ETA se necessário
    if (status === 'accepted' || status === 'in_progress') {
      const destination = status === 'accepted' ? ride.origin : ride.destination;
      const eta = await calculateETA(ride.driverLocation, destination);
      ride.estimatedArrival = eta;
    }

    res.json({
      success: true,
      ride
    });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar status'
    });
  }
});

// Reportar problema durante a corrida
router.post('/:rideId/report', authenticateToken, async (req, res) => {
  try {
    const { type, description } = req.body;
    const ride = await Ride.findById(req.params.rideId);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Corrida não encontrada'
      });
    }

    // Verifica se é participante da corrida
    if (ride.passenger.id !== req.user.id && ride.driver?.id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado'
      });
    }

    // Adiciona o reporte ao histórico da corrida
    const report = {
      type,
      description,
      reportedBy: req.user.id,
      reportedAt: new Date()
    };

    ride.reports = ride.reports || [];
    ride.reports.push(report);
    await ride.save();

    res.json({
      success: true,
      ride
    });
  } catch (error) {
    console.error('Erro ao reportar problema:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao reportar problema'
    });
  }
});

// Adicione esta função de utilidade no arquivo
function calculateCancellationPenalty(ride) {
  // Se a corrida já começou, aplica penalidade maior
  if (ride.status === 'in_progress') {
    return ride.estimatedPrice * 0.3; // 30% do valor estimado
  }

  // Se o motorista já chegou ao local
  if (ride.driverArrived) {
    return ride.estimatedPrice * 0.2; // 20% do valor estimado
  }

  // Se apenas aceitou a corrida
  if (ride.status === 'accepted') {
    const minutesSinceAcceptance = (new Date() - new Date(ride.acceptedAt)) / 1000 / 60;
    if (minutesSinceAcceptance > 5) {
      return ride.estimatedPrice * 0.1; // 10% do valor estimado após 5 minutos
    }
  }

  return 0; // Sem penalidade
}

module.exports = router; 