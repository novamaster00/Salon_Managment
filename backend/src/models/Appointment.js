const mongoose = require('mongoose');
const STATUS = require('../constants/status');
const { isValid24HourTime, isValidDateFormat } = require('../utils/dateUtils');

const AppointmentSchema = new mongoose.Schema({
  customerInfo: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true }
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide a customer ID']
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
  requestedTime: {
    type: String,
    required: [true, 'Please provide a requested time in 24-hour format (HH:MM)'],
    validate: {
      validator: function(value) {
        return isValid24HourTime(value);
      },
      message: 'Requested time must be in 24-hour format (HH:MM)'
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
    default: STATUS.PENDING_APPROVAL
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
AppointmentSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});
AppointmentSchema.index(
  { "customerInfo.email": 1, date: 1, requestedTime: 1 },
  { unique: true }
)

module.exports = mongoose.model('Appointment', AppointmentSchema);