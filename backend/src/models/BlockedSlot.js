const mongoose = require('mongoose');
const { isValid24HourTime, isValidDateFormat } = require('../utils/dateUtils');

const BlockedSlotSchema = new mongoose.Schema({
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
    required: [true, 'Please provide a start time in 24-hour format (HH:MM)'],
    validate: {
      validator: function(value) {
        return isValid24HourTime(value);
      },
      message: 'Start time must be in 24-hour format (HH:MM)'
    }
  },
  endTime: {
    type: String,
    required: [true, 'Please provide an end time in 24-hour format (HH:MM)'],
    validate: {
      validator: function(value) {
        return isValid24HourTime(value);
      },
      message: 'End time must be in 24-hour format (HH:MM)'
    }
  },
  reason: {
    type: String,
    trim: true
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
BlockedSlotSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Validate that endTime is after startTime
BlockedSlotSchema.pre('validate', function(next) {
  if (this.startTime && this.endTime) {
    const [startHour, startMinute] = this.startTime.split(':').map(Number);
    const [endHour, endMinute] = this.endTime.split(':').map(Number);
    
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    
    if (endTotalMinutes <= startTotalMinutes) {
      this.invalidate('endTime', 'End time must be after start time');
    }
  }
  next();
});

module.exports = mongoose.model('BlockedSlot', BlockedSlotSchema);