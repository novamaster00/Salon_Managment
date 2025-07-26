//../controller/availableSlotsController
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const { findAvailableTimeDurations } = require('../services/findAvailableTimeSlot');
const User = require('../models/User');
const AtomicReservationService = require('../services/atomicReservationService');

// @desc    Get available time slots for a barber on a specific date
// @route   POST /api/available-slots
// @access  Public
const getAvailableSlots = asyncHandler(async (req, res, next) => {
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

  // Get all available time durations based on working hours
  const availableSlots = await findAvailableTimeDurations(barberId, date);

  if (!availableSlots.length) {
    return res.status(200).json({
      success: true,
      message: 'No available slots for this date',
      data: []
    });
  }

  // Filter out reserved slots
  const availableAndUnreserved = [];

  for (const slot of availableSlots) {
    const isReserved = await AtomicReservationService.isSlotReserved(
      barberId,
      date,
      slot.start
    );

    if (!isReserved) {
      availableAndUnreserved.push(slot);
    }
  }

  res.status(200).json({
    success: true,
    count: availableAndUnreserved.length,
    data: availableAndUnreserved
  });
});

module.exports = getAvailableSlots;