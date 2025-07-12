//../controller/availableSlotsController
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const { findAvailableTimeDurations } = require('../services/findAvailableTimeSlot');
const User = require('../models/User');

// @desc    Get available time slots for a barber on a specific date
// @route   POST /api/available-slots
// @access  Public
const getAvailableSlots = async (req, res, next) => {
  const { barberId, date } = req.body;
  
  // Validate required fields
  if (!barberId || !date) {
    return next(new ErrorResponse('Please provide both barberId and date', 400));
  }
  
  // Verify barber exists
  const barber = await User.findOne({
    _id: barberId,
    role: 'barber'
  });
  
  if (!barber) {
    return next(new ErrorResponse('Barber not found', 404));
  }
  
  // Get available slots
  const availableSlots = await findAvailableTimeDurations(barberId, date);
  
  res.status(200).json({
    success: true,
    count: availableSlots.length,
    data: availableSlots
  });
}

module.exports = getAvailableSlots;