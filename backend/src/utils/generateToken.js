const { v4: uuidv4 } = require('uuid');
const { tokenConfig } = require('../config/serviceConfig');

/**
 * Generates a unique token for appointments and walk-ins
 * 
 * @param {string} type - 'appointment' or 'walkin'
 * @param {Date} date - The date for the token
 * @returns {string} - A formatted unique token
 */
const generateToken = (type, date) => {
  // Validate type
  if (!['appointment', 'walkin'].includes(type.toLowerCase())) {
    throw new Error('Invalid token type. Must be "appointment" or "walkin"');
  }
  
  // Format date as YYYYMMDD
  const dateFormatted = date instanceof Date 
    ? date.toISOString().slice(0, 10).replace(/-/g, '')
    : new Date().toISOString().slice(0, 10).replace(/-/g, '');
  
  // Get prefix based on type
  const prefix = tokenConfig.prefix[type.toLowerCase()];
  
  // Generate a short unique ID (first 4 chars of a UUID)
  const uniqueId = uuidv4().split('-')[0].slice(0, 4).toUpperCase();
  
  // Combine parts using the configured delimiter
  return `${prefix}${tokenConfig.delimiter}${dateFormatted}${tokenConfig.delimiter}${uniqueId}`;
};

module.exports = generateToken;