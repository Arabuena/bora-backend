const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
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

// Listar conversas de suporte (para admin)
router.get('/support/conversations', authenticateToken, async (req, res) => {
  try {
    // Verifica se é admin
    if (req.user.email !== 'admin@example.com') {
      return res.status(403).json({ success: false, message: 'Não autorizado' });
    }

    // Busca todas as mensagens agrupadas por usuário
    const conversations = await Message.aggregate([
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            userId: '$sender._id',
            userName: '$sender.name',
            userRole: '$sender.role'
          },
          lastMessage: { $first: '$content' },
          lastMessageAt: { $first: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$read', false] }, { $ne: ['$sender.role', 'admin'] }] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          userId: '$_id.userId',
          userName: '$_id.userName',
          userRole: '$_id.userRole',
          lastMessage: 1,
          lastMessageAt: 1,
          unreadCount: 1,
          _id: 0
        }
      }
    ]);

    res.json(conversations);
  } catch (error) {
    console.error('Erro ao listar conversas:', error);
    res.status(500).json({ success: false, message: 'Erro ao listar conversas' });
  }
});

// Buscar mensagens de um usuário específico
router.get('/support/user/:userId', authenticateToken, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { 'sender._id': req.params.userId },
        { 'receiver._id': req.params.userId }
      ]
    }).sort({ createdAt: 1 });

    // Marca mensagens como lidas
    if (req.user.email === 'admin@example.com') {
      await Message.updateMany(
        { 
          'sender._id': req.params.userId,
          read: false
        },
        { read: true }
      );
    }

    res.json(messages);
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar mensagens' });
  }
});

// Enviar mensagem de suporte
router.post('/support/reply', authenticateToken, async (req, res) => {
  try {
    const { userId, content } = req.body;

    // Busca informações do usuário destinatário
    const receiver = await User.findById(userId);
    if (!receiver) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }

    const message = new Message({
      sender: {
        _id: req.user.id,
        name: req.user.name,
        role: 'admin'
      },
      receiver: {
        _id: receiver._id,
        name: receiver.name,
        role: receiver.role
      },
      content
    });

    await message.save();
    res.json(message);
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ success: false, message: 'Erro ao enviar mensagem' });
  }
});

module.exports = router; 