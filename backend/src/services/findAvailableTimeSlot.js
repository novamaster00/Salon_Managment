const Appointment = require('../models/Appointment');
const BlockedSlot = require('../models/BlockedSlot');
const WaitingQueue = require('../models/WaitingQueue');
const WorkingHours = require('../models/WorkingHours');
const WalkIn = require('../models/WalkIn');
const STATUS = require('../constants/status');
const { 
  compareTimeStrings, 
  addMinutesToTime,
  getMinutesBetweenTimes
} = require('../utils/dateUtils');
const { bufferTime } = require('../config/serviceConfig');

/**
 * Get all slots for a barber on a specific date
 * 
 * @param {string} barberId - The barber's ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Array>} - Array of available time slots
 */
const findAvailableTimeDurations = async (barberId, date) => {
  // Get the working hours for this barber on this date
  const workingHours = await WorkingHours.findOne({
    barberId,
    date,
    isAvailable: true
  });

  if (!workingHours) {
    return [];
  }

  const { startTime, endTime } = workingHours;

  // Get all booked appointments for this barber on this date
  const appointments = await Appointment.find({
    barberId,
    date,
    status: { $in: [STATUS.APPROVED, STATUS.PENDING_APPROVAL, STATUS.ONGOING] }
  }).select('startTime endTime');

  // Get all blocked slots for this date
  const blockedSlots = await BlockedSlot.find({
    barberId,
    date
  }).select('startTime endTime');

  // Get all walk-ins for this date
  const walkIns = await WalkIn.find({
    barberId,
    date,
    status: { $in: [STATUS.WAITING, STATUS.APPROVED, STATUS.ONGOING] }
  }).select('startTime endTime');

  // Combine all unavailable time slots
  const busySlots = [
    ...appointments.map(a => ({ start: a.startTime, end: a.endTime })),
    ...blockedSlots.map(b => ({ start: b.startTime, end: b.endTime })),
    ...walkIns.map(w => ({ start: w.startTime, end: w.endTime }))
  ].filter(slot => slot.start && slot.end); // Filter out any incomplete slots

  // Sort busy slots by start time
  busySlots.sort((a, b) => compareTimeStrings(a.start, b.start));

  // Find free intervals
  const freeSlots = [];
  let currentTime = startTime;

  for (const busySlot of busySlots) {
    // If there's a gap before this busy slot, it's a free slot
    if (compareTimeStrings(currentTime, busySlot.start) < 0) {
      freeSlots.push({
        start: currentTime,
        end: busySlot.start
      });
    }
    
    // Update currentTime to the end of this busy slot
    if (compareTimeStrings(currentTime, busySlot.end) < 0) {
      currentTime = busySlot.end;
    }
  }

  // Check if there's a slot after the last busy slot
  if (compareTimeStrings(currentTime, endTime) < 0) {
    freeSlots.push({
      start: currentTime,
      end: endTime
    });
  }

  // Apply buffer time to each free slot
  const bufferedFreeSlots = freeSlots.filter(slot => {
    const slotDuration = getMinutesBetweenTimes(slot.start, slot.end);
    return slotDuration >= bufferTime; // Only include slots longer than buffer time
  }).map(slot => {
    // Apply buffer at the beginning and end of each slot
    const bufferMinutes = Math.floor(bufferTime / 2);
    return {
      start: addMinutesToTime(slot.start, bufferMinutes),
      end: addMinutesToTime(slot.end, -bufferMinutes)
    };
  }).filter(slot => {
    // Verify that after applying buffers, the slot still exists
    return compareTimeStrings(slot.start, slot.end) < 0;
  });

  return bufferedFreeSlots;
};

/**
 * Checks if a specific time slot is available
 * 
 * @param {string} barberId - The barber's ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} startTime - Start time in HH:MM format
 * @param {string} endTime - End time in HH:MM format
 * @returns {Promise<boolean>} - True if the slot is available
 */
const isTimeSlotAvailable = async (barberId, date, startTime, endTime) => {
  // Get all available slots
  const availableSlots = await findAvailableTimeDurations(barberId, date);
  
  // Check if requested slot fits within any available slot
  return availableSlots.some(slot => 
    compareTimeStrings(startTime, slot.start) >= 0 && 
    compareTimeStrings(endTime, slot.end) <= 0
  );
};

/**
 * Finds the next available time slot after the requested time
 * 
 * @param {string} barberId - The barber's ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} requestedTime - Requested start time in HH:MM format
 * @param {number} duration - Duration in minutes
 * @returns {Promise<Object>} - Next available slot or null
 */
const findNextAvailableSlot = async (barberId, date, requestedTime, duration) => {
  const availableSlots = await findAvailableTimeDurations(barberId, date);
  
  // Calculate the end time based on requested time and duration
  const requestedEndTime = addMinutesToTime(requestedTime, duration);
  
  // Find slots where the requested time range fits
  const viableSlots = availableSlots.filter(slot => {
    return (
      compareTimeStrings(requestedTime, slot.start) >= 0 && 
      compareTimeStrings(requestedEndTime, slot.end) <= 0
    );
  });
  
  if (viableSlots.length > 0) {
    // Return the requested time if it fits in an available slot
    return {
      start: requestedTime,
      end: requestedEndTime
    };
  }
  
  // If no viable slot found at the requested time, find the next available
  for (const slot of availableSlots) {
    if (compareTimeStrings(slot.start, requestedTime) > 0) {
      // This slot starts after the requested time
      const slotDuration = getMinutesBetweenTimes(slot.start, slot.end);
      
      if (slotDuration >= duration) {
        // This slot is long enough for the service
        return {
          start: slot.start,
          end: addMinutesToTime(slot.start, duration)
        };
      }
    }
  }
  
  // No available slot found
  return null;
};

module.exports = {
  findAvailableTimeDurations,
  isTimeSlotAvailable,
  findNextAvailableSlot
};