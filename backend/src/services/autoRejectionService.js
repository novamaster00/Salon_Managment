const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const STATUS = require('../constants/status');
const { autoRejection } = require('../config/serviceConfig');
const { sendAutoRejectionNotification } = require('./notificationService');

/**
 * Reject appointments that have been pending for too long
 */
const rejectPendingAppointments = async () => {
  console.log('Running auto-rejection check for pending appointments');
  const cutoffTime = new Date(Date.now() - autoRejection.pendingTimeLimit);
  
  try {
    // Find appointments that have been pending for too long
    const pendingAppointments = await Appointment.find({
      status: STATUS.PENDING_APPROVAL,
      createdAt: { $lt: cutoffTime }
    });
    
    console.log(`Found ${pendingAppointments.length} appointments to auto-reject`);
    
    for (const appointment of pendingAppointments) {
      // Update appointment status
      appointment.status = STATUS.REJECTED;
      await appointment.save();
      
      // Send notification to customer
      const customer = await User.findById(appointment.customerId);
      if (customer) {
        await sendAutoRejectionNotification(appointment, customer);
      }
      
      console.log(`Auto-rejected appointment ${appointment._id}`);
    }
  } catch (error) {
    console.error('Error in auto-rejection service:', error);
  }
};

/**
 * Schedule auto-rejection job
 */
const scheduleAutoRejection = () => {
  // Convert milliseconds to minutes for cron expression
  const intervalMinutes = Math.floor(autoRejection.checkInterval / 60000);
  
  // Run every X minutes where X is derived from the configuration
  const cronExpression = `*/${intervalMinutes} * * * *`;
  
  return cron.schedule(cronExpression, rejectPendingAppointments);
};

module.exports = {
  rejectPendingAppointments,
  scheduleAutoRejection
};