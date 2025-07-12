/**
 * Utility functions for date and time handling
 */

/**
 * Checks if a time string is in valid 24-hour format (HH:MM)
 * 
 * @param {string} time - Time string to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValid24HourTime = (time) => {
  if (!time || typeof time !== 'string') return false;
  
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return regex.test(time);
};

/**
 * Validates if a date string is in YYYY-MM-DD format
 * 
 * @param {string} dateStr - Date string to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidDateFormat = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return false;
  
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  
  // Check if it's a valid date (not just valid format)
  const date = new Date(dateStr);
  const timestamp = date.getTime();
  if (isNaN(timestamp)) return false;
  
  return date.toISOString().slice(0, 10) === dateStr;
};

/**
 * Compares two time strings (HH:MM format)
 * 
 * @param {string} time1 - First time to compare
 * @param {string} time2 - Second time to compare
 * @returns {number} - Negative if time1 < time2, 0 if equal, positive if time1 > time2
 */
const compareTimeStrings = (time1, time2) => {
  if (!isValid24HourTime(time1) || !isValid24HourTime(time2)) {
    throw new Error('Invalid time format. Use HH:MM in 24-hour format');
  }
  
  const [hours1, minutes1] = time1.split(':').map(Number);
  const [hours2, minutes2] = time2.split(':').map(Number);
  
  if (hours1 !== hours2) return hours1 - hours2;
  return minutes1 - minutes2;
};

/**
 * Adds minutes to a time string (HH:MM format)
 * 
 * @param {string} time - The time string in HH:MM format
 * @param {number} minutes - Minutes to add
 * @returns {string} - New time in HH:MM format
 */
const addMinutesToTime = (time, minutes) => {
  if (!isValid24HourTime(time)) {
    throw new Error('Invalid time format. Use HH:MM in 24-hour format');
  }
  
  const [hours, mins] = time.split(':').map(Number);
  
  let totalMinutes = hours * 60 + mins + minutes;
  
  // Handle overflow
  while (totalMinutes >= 24 * 60) {
    totalMinutes -= 24 * 60;
  }
  
  const newHours = Math.floor(totalMinutes / 60);
  const newMinutes = totalMinutes % 60;
  
  return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
};

/**
 * Calculates the difference between two time strings in minutes
 * 
 * @param {string} startTime - Start time in HH:MM format
 * @param {string} endTime - End time in HH:MM format
 * @returns {number} - Difference in minutes
 */
const getMinutesBetweenTimes = (startTime, endTime) => {
  if (!isValid24HourTime(startTime) || !isValid24HourTime(endTime)) {
    throw new Error('Invalid time format. Use HH:MM in 24-hour format');
  }
  
  const [startHours, startMins] = startTime.split(':').map(Number);
  const [endHours, endMins] = endTime.split(':').map(Number);
  
  let startTotalMinutes = startHours * 60 + startMins;
  let endTotalMinutes = endHours * 60 + endMins;
  
  // Handle case where end time is on the next day
  if (endTotalMinutes < startTotalMinutes) {
    endTotalMinutes += 24 * 60;
  }
  
  return endTotalMinutes - startTotalMinutes;
};

module.exports = {
  isValid24HourTime,
  isValidDateFormat,
  compareTimeStrings,
  addMinutesToTime,
  getMinutesBetweenTimes
};