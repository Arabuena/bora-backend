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
    car: String,
    plate: String,
    rating: Number
  },
  origin: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  originCoordinates: {
    latitude: Number,
    longitude: Number
  },
  destinationCoordinates: {
    latitude: Number,
    longitude: Number
  },
  driverLocation: {
    latitude: Number,
    longitude: Number,
    updatedAt: Date
  },
  status: {
    type: String,
    enum: ['searching', 'accepted', 'arrived', 'in_progress', 'completed', 'cancelled'],
    default: 'searching'
  },
  distance: Number,
  estimatedPrice: Number,
  estimatedTime: Number,
  actualPrice: Number,
  startTime: Date,
  endTime: Date,
  duration: Number,
  driverArrived: {
    type: Boolean,
    default: false
  },
  arrivedAt: Date,
  cancelReason: String,
  cancelledBy: String,
  cancelledAt: Date,
  rating: {
    passenger: Number,
    driver: Number,
    comment: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  verificationCode: {
    type: String,
    default: () => Math.random().toString(36).substr(2, 6).toUpperCase()
  },
  codeVerified: {
    type: Boolean,
    default: false
  },
  reports: [{
    type: {
      type: String,
      enum: ['safety', 'behavior', 'route', 'technical', 'other']
    },
    description: String,
    reportedBy: String,
    reportedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'investigating', 'resolved'],
      default: 'pending'
    }
  }],
  rideMetrics: {
    distanceTraveled: Number,
    actualDuration: Number,
    routeDeviations: Number,
    speedEvents: [{
      timestamp: Date,
      speed: Number,
      location: {
        latitude: Number,
        longitude: Number
      }
    }]
  }
});

// Adicione índices para melhor performance
rideSchema.index({ status: 1, createdAt: -1 });
rideSchema.index({ 'passenger.id': 1 });
rideSchema.index({ 'driver.id': 1 });

module.exports = mongoose.model('Ride', rideSchema); 