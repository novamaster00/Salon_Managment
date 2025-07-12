/**
 * Send a notification for appointment status change
 * 
 * @param {Object} appointment - Appointment document
 * @param {Object} user - User document (customer)
 * @param {string} status - New status
 * @returns {Promise<void>}
 */
const sendAppointmentStatusNotification = async (appointment, user, status) => {
  const statusMessages = {
    approved: 'Your appointment has been approved!',
    rejected: 'Your appointment has been rejected.',
    completed: 'Your appointment has been marked as completed.',
    ongoing: 'Your appointment is now in progress.'
  };

  // Return notification data for frontend to display
  return {
    title: 'Appointment Update',
    message: statusMessages[status] || 'Your appointment status has been updated.',
    data: {
      type: 'appointment',
      id: appointment._id,
      date: appointment.date,
      time: appointment.startTime || appointment.requestedTime,
      service: appointment.service,
      status
    }
  };
};

/**
 * Send a notification for walk-in acceptance
 * 
 * @param {Object} walkIn - WalkIn document
 * @returns {Promise<void>}
 */
const sendWalkInNotification = async (walkIn) => {
  return {
    title: 'Walk-in Accepted',
    message: 'Your walk-in request has been accepted and added to our queue.',
    data: {
      type: 'walkin',
      id: walkIn._id,
      date: walkIn.date,
      arrivalTime: walkIn.arrivalTime,
      startTime: walkIn.startTime,
      service: walkIn.service,
      tokenNumber: walkIn.tokenNumber
    }
  };
};

/**
 * Send a token assignment notification
 * 
 * @param {Object} queueEntry - WaitingQueue document with populated source
 * @returns {Promise<void>}
 */
const sendTokenAssignmentNotification = async (queueEntry) => {
  return {
    title: 'Queue Token Assigned',
    message: 'You have been added to our waiting queue.',
    data: {
      type: 'token',
      id: queueEntry._id,
      date: queueEntry.date,
      tokenNumber: queueEntry.tokenNumber,
      position: queueEntry.position,
      estimatedStartTime: queueEntry.estimatedStartTime
    }
  };
};

/**
 * Send a notification to a barber about a new walk-in
 * 
 * @param {Object} walkIn - WalkIn document
 * @param {Object} barber - Barber user document
 * @returns {Promise<void>}
 */
const notifyBarberAboutWalkIn = async (walkIn, barber) => {
  return {
    title: 'New Walk-in Customer',
    message: 'A new walk-in customer has been added to your queue.',
    data: {
      type: 'barber_notification',
      id: walkIn._id,
      customerName: walkIn.customerName,
      date: walkIn.date,
      arrivalTime: walkIn.arrivalTime,
      service: walkIn.service,
      tokenNumber: walkIn.tokenNumber
    }
  };
};

/**
 * Send a notification about appointment auto-rejection
 * 
 * @param {Object} appointment - Appointment document
 * @param {Object} customer - Customer user document
 * @returns {Promise<void>}
 */
const sendAutoRejectionNotification = async (appointment, customer) => {
  return {
    title: 'Appointment Auto-Rejected',
    message: 'Your appointment request has been automatically rejected because it was not approved within the required time frame.',
    data: {
      type: 'auto_rejection',
      id: appointment._id,
      date: appointment.date,
      requestedTime: appointment.requestedTime,
      service: appointment.service
    }
  };
};

module.exports = {
  sendAppointmentStatusNotification,
  sendWalkInNotification,
  sendTokenAssignmentNotification,
  notifyBarberAboutWalkIn,
  sendAutoRejectionNotification
};