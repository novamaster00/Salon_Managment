module.exports = {
  // Token generation configuration
  tokenConfig: {
    prefix: {
      appointment: 'APPT',
      walkin: 'WALKIN'
    },
    delimiter: '-'
  },
  
  // Auto-rejection configuration
  autoRejection: {
    pendingTimeLimit: 2 * 60 * 60 * 1000, // 2 hours in milliseconds
    checkInterval: 15 * 60 * 1000 // 15 minutes in milliseconds
  },
  
  // Buffer time between appointments (in minutes)
  bufferTime: 10
};