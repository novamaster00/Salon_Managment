const WorkingHours = require('../models/WorkingHours');
const { compareTimeStrings, addMinutesToTime } = require('../utils/dateUtils');
const { isTimeSlotAvailable } = require('../services/findAvailableTimeSlot');

// Service durations in minutes
const SERVICE_DURATIONS = {
  'haircut': 30,
  'haircut-and-beard': 45,
  'beard-trim': 15,
  'haircut-and-styling': 60,
  'coloring': 90,
  'styling': 30,
  'kids-haircut': 20,
  'shave': 30,
  'facial': 45,
  'full-service': 90
};

/**
 * Checks if a specific time slot is available
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with availability status
 */
const checkSlotAvailability = async (req, res) => {
  try {
    const { barberId, date, requestedTime, service } = req.body;

    // Validate required fields
    if (!barberId || !date || !requestedTime) {
      return res.status(400).json({ 
        success: false, 
        message: 'barberId, date, and time are required' 
      });
    }

    // Validate service type
    if (!service || !SERVICE_DURATIONS[service]) {
      return res.status(400).json({
        success: false,
        message: 'Valid service is required'
      });
    }

    // Check if the date is in the correct format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Date must be in YYYY-MM-DD format' 
      });
    }

    // Check if the time is in the correct format (HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(requestedTime)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Time must be in HH:MM format' 
      });
    }

    // 1. Check if barber is working on that date
    const workingHours = await WorkingHours.findOne({
      barberId,
      date,
      isAvailable: true
    });

    if (!workingHours) {
      return res.status(200).json({ 
        available: false, 
        message: 'Barber is not working on this date' 
      });
    }

    // Check if requested time is within working hours
    if (
      compareTimeStrings(requestedTime, workingHours.startTime) < 0 ||
      compareTimeStrings(requestedTime, workingHours.endTime) >= 0
    ) {
      return res.status(200).json({ 
        available: false, 
        message: 'Requested time is outside working hours' 
      });
    }

    // Calculate parameters for isTimeSlotAvailable function
    const startTime = requestedTime;
    
    // Get service duration and calculate end time
    const serviceDuration = SERVICE_DURATIONS[service];
    const endTime = addMinutesToTime(startTime, serviceDuration);
    
    // Check if the calculated end time is still within working hours
    if (compareTimeStrings(endTime, workingHours.endTime) > 0) {
      return res.status(200).json({
        available: false,
        message: 'Not enough time left in working hours for this service'
      });
    }
    
    // Use the existing isTimeSlotAvailable function to check availability
    const isAvailable = await isTimeSlotAvailable(barberId, date, startTime, endTime);
    
    if (isAvailable) {
      return res.status(200).json({
        available: true,
        message: 'The requested time is available',
        slot: {
          start: startTime,
          end: endTime,
          duration: serviceDuration
        }
      });
    } else {
      return res.status(200).json({
        available: false,
        message: 'The requested time slot is not available'
      });
    }
  } catch (error) {
    console.error('Error checking slot availability:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error while checking slot availability' 
    });
  }
};

module.exports = {
  checkSlotAvailability
};