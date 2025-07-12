const mongoose = require('mongoose');
const STATUS = require('../constants/status');

const WaitingQueueSchema = new mongoose.Schema({
  barberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide a barber ID']
  },
  date: {
    type: String,
    required: [true, 'Please provide a date in YYYY-MM-DD format']
  },
  tokenNumber: {
    type: String,
    required: [true, 'Token number is required'],
    unique: true
  },
  sourceType: {
    type: String,
    enum: ['appointment', 'walkin'],
    required: [true, 'Source type is required']
  },
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Source ID is required'],
    refPath: 'sourceType'
  },
  estimatedTime: {
    type: Number,
    min: [5, 'Estimated time must be at least 5 minutes'],
    max: [300, 'Estimated time cannot exceed 300 minutes'],
    required: [true, 'Estimated time is required']
  },
  estimatedStartTime: {
    type: String
  },
  position: {
    type: Number,
    required: [true, 'Queue position is required'],
    min: [1, 'Position must be at least 1']
  },
  status: {
    type: String,
    enum: Object.values(STATUS),
    default: STATUS.WAITING
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on modification
WaitingQueueSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index to optimize queue position queries
WaitingQueueSchema.index({ barberId: 1, date: 1, position: 1 });

module.exports = mongoose.model('WaitingQueue', WaitingQueueSchema);