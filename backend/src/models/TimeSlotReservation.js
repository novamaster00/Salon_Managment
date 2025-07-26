const mongoose = require('mongoose');

const timeSlotReservationSchema = new mongoose.Schema({
  barberId: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  reservationType: {
    type: String,
    enum: ['appointment', 'walkin'],
    required: true
  },
  reservedBy: {
    type: String, // user email or walk-in ID
    required: true
  },
  reservedAt: {
    type: Date,
    default: Date.now,
    expires: 120 // 2 minutes TTL
  }
}, {
  timestamps: true
});

// Compound index for unique reservations
timeSlotReservationSchema.index({ 
  barberId: 1, 
  date: 1, 
  startTime: 1 
}, { unique: true });

module.exports = mongoose.model('TimeSlotReservation', timeSlotReservationSchema);