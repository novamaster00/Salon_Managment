const mongoose = require('mongoose');
const STATUS = require('../constants/status');
const { isValid24HourTime, isValidDateFormat } = require('../utils/dateUtils');

const WalkInSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: [true, 'Please provide a customer name'],
    trim: true
  },
  customerEmail: {
    type: String,
    required: [true, 'Please provide a customer email'],
    match: [
      /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/,
      'Please provide a valid email'
    ],
    lowercase: true,
    trim: true
  },
  customerPhone: {
    type: String,
    trim: true
  },
  barberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide a barber ID']
  },
  date: {
    type: String,
    required: [true, 'Please provide a date in YYYY-MM-DD format'],
    validate: {
      validator: function(value) {
        return isValidDateFormat(value);
      },
      message: 'Date must be in YYYY-MM-DD format'
    }
  },
  
  startTime: {
    type: String,
    validate: {
      validator: function(value) {
        return value === null || isValid24HourTime(value);
      },
      message: 'Start time must be in 24-hour format (HH:MM)'
    }
  },
  endTime: {
    type: String,
    validate: {
      validator: function(value) {
        return value === null || isValid24HourTime(value);
      },
      message: 'End time must be in 24-hour format (HH:MM)'
    }
  },
  estimatedTime: {
    type: Number,
    min: [5, 'Estimated time must be at least 5 minutes'],
    max: [300, 'Estimated time cannot exceed 300 minutes']
  },
  service: {
    type: String,
    required: [true, 'Please provide a service'],
    trim: true
  },
  status: {
    type: String,
    enum: Object.values(STATUS),
    default: STATUS.WAITING
  },
  notes: {
    type: String,
    trim: true
  },
  tokenNumber: {
    type: String
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
WalkInSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('WalkIn', WalkInSchema);