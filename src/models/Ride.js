const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  passenger: {
    id: String,
    email: String,
    name: String
  },
  driver: {
    id: String,
    email: String,
    name: String,
    car: String
  },
  origin: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['searching', 'accepted', 'in_progress', 'completed', 'cancelled'],
    default: 'searching'
  },
  distance: Number,
  estimatedPrice: Number,
  estimatedTime: Number,
  actualPrice: Number,
  startTime: Date,
  endTime: Date,
  duration: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Ride', rideSchema); 