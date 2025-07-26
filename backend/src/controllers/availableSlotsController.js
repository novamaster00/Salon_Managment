//../controller/availableSlotsController
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const { findAvailableTimeDurations } = require('../services/findAvailableTimeSlot');
const User = require('../models/User');
<<<<<<< HEAD
=======
const AtomicReservationService = require('../services/atomicReservationService');
>>>>>>> 0011b2f (trying to add into Production ready code to Production Branch)

// @desc    Get available time slots for a barber on a specific date
// @route   POST /api/available-slots
// @access  Public
<<<<<<< HEAD
const getAvailableSlots = async (req, res, next) => {
  const { barberId, date } = req.body;
  
=======
const getAvailableSlots = asyncHandler(async (req, res, next) => {
  const { barberId, date } = req.body;

>>>>>>> 0011b2f (trying to add into Production ready code to Production Branch)
  // Validate required fields
  if (!barberId || !date) {
    return next(new ErrorResponse('Please provide both barberId and date', 400));
  }
<<<<<<< HEAD
  
=======

>>>>>>> 0011b2f (trying to add into Production ready code to Production Branch)
  // Verify barber exists
  const barber = await User.findOne({
    _id: barberId,
    role: 'barber'
  });
<<<<<<< HEAD
  
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
=======

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
>>>>>>> 0011b2f (trying to add into Production ready code to Production Branch)

module.exports = getAvailableSlots;