const ErrorResponse = require('../utils/errorResponse');
const WorkingHours = require('../models/WorkingHours');
const { compareTimeStrings } = require('../utils/dateUtils');
const asyncHandler = require('./async');

// Middleware to enforce walk-ins only during working hours
exports.enforceWorkingHours = asyncHandler(async (req, res, next) => {
  const { barberId, date, arrivalTime } = req.body;
  
  if (!barberId || !date || !arrivalTime ) {
    return next(new ErrorResponse('Missing required fields', 400));
  }

  // Find working hours for the barber on the given date
  const workingHours = await WorkingHours.findOne({ 
    barberId, 
    date,
    isAvailable: true 
  });

  if (!workingHours) {
    return next(
      new ErrorResponse(`Barber is not available on ${date}`, 400)
    );
  }

  // Check if arrival time is within working hours
  if (
    compareTimeStrings(arrivalTime, workingHours.startTime) < 0 ||
    compareTimeStrings(arrivalTime, workingHours.endTime) >= 0
  ) {
    return next(
      new ErrorResponse(
        `Walk-in denied. Try again during working hours (${workingHours.startTime} - ${workingHours.endTime})`,
        400
      )
    );
  }

  // Add working hours to request for other middleware/controllers
  req.workingHours = workingHours;
  next();
});

// Middleware to check if a time slot is available
exports.checkTimeAvailability = asyncHandler(async (req, res, next) => {
  // This middleware would check against existing appointments, blocked slots, etc.
  // Implementation depends on the findAvailableTimeSlot service
  
  // For now, we'll just check working hours as above
  const { barberId, date, requestedTime } = req.body;
  
  if (!barberId || !date || !requestedTime) {
    return next(new ErrorResponse('Missing required fields', 400));
  }

  const workingHours = await WorkingHours.findOne({ 
    barberId, 
    date,
    isAvailable: true 
  });

  if (!workingHours) {
    return next(
      new ErrorResponse(`Barber is not available on ${date}`, 400)
    );
  }

  if (
    compareTimeStrings(requestedTime, workingHours.startTime) < 0 ||
    compareTimeStrings(requestedTime, workingHours.endTime) >= 0
  ) {
    return next(
      new ErrorResponse(
        `Requested time is outside working hours (${workingHours.startTime} - ${workingHours.endTime})`,
        400
      )
    );
  }

  req.workingHours = workingHours;
  next();
});