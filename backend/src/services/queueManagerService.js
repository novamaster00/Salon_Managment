const WaitingQueue = require('../models/WaitingQueue');
const Appointment = require('../models/Appointment');
const WalkIn = require('../models/WalkIn');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const STATUS = require('../constants/status');
const { sendTokenAssignmentNotification } = require('./notificationService');
const { addMinutesToTime } = require('../utils/dateUtils');
const { default: mongoose } = require('mongoose');

/**
 * Add an appointment to the waiting queue
 * 
 * @param {string} appointmentId - ID of the appointment
 * @param {boolean} sendNotification - Whether to send a notification
 * @returns {Promise<Object>} - The created queue entry
 */
const addAppointmentToQueue = async (appointmentMOD, sendNotification = true, allowAnyStatus = false) => {
  try {
    console.log("\n\n\n\n\n\n\n\n\n\n====addAppointmentToQueue started====");
    console.log("Input parameter:", appointmentMOD);
    console.log("Allow any status:", allowAnyStatus);
    
    // Handle both ObjectId and populated appointment object
    let appointment;
    let appointmentId;
    
    if (typeof appointmentMOD === 'string' || appointmentMOD instanceof mongoose.Types.ObjectId) {
      console.log("Fetching appointment by ID:", appointmentMOD);
      appointment = await Appointment.findById(appointmentMOD).populate('customerId');
      appointmentId = appointmentMOD;
    } else if (appointmentMOD && appointmentMOD._id) {
      console.log("Using provided appointment object");
      appointment = appointmentMOD;
      appointmentId = appointment._id;
    } else {
      throw new Error('Invalid appointment parameter provided');
    }
    
    if (!appointment) {
      throw new Error('Appointment not found');
    }
    
    console.log("Found appointment ID:", appointmentId);
    console.log("Current appointment status:", appointment.status);
    console.log("Expected status (STATUS.APPROVED):", STATUS.APPROVED);
    
    // Only check status if not allowing any status
    if (!allowAnyStatus && appointment.status !== STATUS.APPROVED) {
      throw new Error(`Only approved appointments can be added to the queue. Current status: ${appointment.status}`);
    }
    
    // If allowing any status, automatically approve the appointment if it's not already approved
    if (allowAnyStatus && appointment.status !== STATUS.APPROVED) {
      console.log("Auto-approving appointment for queue addition...");
      appointment.status = STATUS.APPROVED;
      await appointment.save();
      console.log("Appointment approved");
    }
    
    // Check if already in queue
    console.log("Checking if appointment already in queue...");
    const existingEntry = await WaitingQueue.findOne({
      sourceType: 'appointment',
      sourceId: appointmentId
    });
    
    if (existingEntry) {
      console.log("Appointment already in queue, updating status to WAITING");
      
      // Update both queue entry and appointment to WAITING status
      existingEntry.status = STATUS.WAITING;
      await existingEntry.save();
      
      appointment.status = STATUS.WAITING;
      await appointment.save();
      
      return existingEntry;
    }
    
    console.log("Appointment not in queue, proceeding to add...");
    
    // Generate token if not already set
    if (!appointment.tokenNumber) {
      console.log("Generating token number...");
      appointment.tokenNumber = generateToken('appointment', new Date(appointment.date));
      await appointment.save();
      console.log("Token generated:", appointment.tokenNumber);
    }
    
    // Get the current position in queue
    console.log("Getting queue position...");
    const highestPosition = await WaitingQueue.findOne({ 
      barberId: appointment.barberId,
      date: appointment.date
    }).sort('-position');
    
    const position = highestPosition ? highestPosition.position + 1 : 1;
    console.log("Queue position:", position);
    
    // Calculate estimated start time
    let estimatedStartTime = appointment.startTime || appointment.requestedTime;
    console.log("Estimated start time:", estimatedStartTime);
    
    // Create queue entry
    console.log("Creating queue entry...");
    const queueEntry = await WaitingQueue.create({
      barberId: appointment.barberId,
      date: appointment.date,
      tokenNumber: appointment.tokenNumber,
      sourceType: 'appointment',
      sourceId: appointmentId,
      estimatedTime: appointment.estimatedTime,
      estimatedStartTime,
      position,
      status: STATUS.WAITING
    });
    console.log("Queue entry created successfully");

    // Update appointment status to WAITING
    console.log("Updating appointment status to WAITING...");
    console.log("Before status change:", appointment.status);
    appointment.status = STATUS.WAITING;
    console.log("After status change (in memory):", appointment.status);
    
    // Save the appointment
    await appointment.save();
    console.log("Appointment saved");
    
    // Verify the save worked
    const savedAppointment = await Appointment.findById(appointmentId);
    console.log("Appointment status after save (from DB):", savedAppointment.status);
    
    // Populate the source for notification
    queueEntry.sourceId = appointment;
    if (appointment.customerId) {
      queueEntry.sourceId.customer = appointment.customerId;
    }
    
    // Send notification
    if (sendNotification) {
      console.log("Sending notification...");
      await sendTokenAssignmentNotification(queueEntry);
      console.log("Notification sent successfully");
    }
    
    console.log("====addAppointmentToQueue completed successfully====\n\n\n\n\n\n\n\n\n\n\n\n");
    return queueEntry;
    
  } catch (error) {
    console.error("Error in addAppointmentToQueue:", error.message);
    console.error("Stack trace:", error.stack);
    throw error; // Re-throw the error so it can be caught by the caller
  }
};

/**
 * Add a walk-in to the waiting queue
 * 
 * @param {string} walkInId - ID of the walk-in
 * @param {boolean} sendNotification - Whether to send a notification
 * @returns {Promise<Object>} - The created queue entry
 */
const addWalkInToQueue = async (walkInId, sendNotification = true) => {
  const walkIn = await WalkIn.findById(walkInId);
  
  if (!walkIn) {
    throw new Error('Walk-in not found');
  }
  
  // Check if already in queue
  const existingEntry = await WaitingQueue.findOne({
    sourceType: 'walkin',
    sourceId: walkInId
  });
  
  if (existingEntry) {
    return existingEntry;
  }
  
  // Generate token if not already set
  if (!walkIn.tokenNumber) {
    walkIn.tokenNumber = generateToken('walkin', new Date(walkIn.date));
    await walkIn.save();
  }
  
  // Get the current position in queue
  const highestPosition = await WaitingQueue.findOne({ 
    barberId: walkIn.barberId,
    date: walkIn.date
  }).sort('-position');
  
  const position = highestPosition ? highestPosition.position + 1 : 1;
  
  // Calculate estimated start time (simplified)
  let estimatedStartTime = walkIn.startTime || walkIn.arrivalTime;
  
  // If there are people in queue, adjust the estimated time
  if (position > 1) {
    // Get previous people in queue and sum their estimated times
    const previousEntries = await WaitingQueue.find({
      barberId: walkIn.barberId,
      date: walkIn.date,
      position: { $lt: position }
    }).sort('position');
    
    let totalMinutes = 0;
    for (const entry of previousEntries) {
      totalMinutes += entry.estimatedTime;
    }
    
    // Add the estimated wait time to the arrival time
    estimatedStartTime = addMinutesToTime(estimatedStartTime, totalMinutes);
  }
  
  // Create queue entry
  const queueEntry = await WaitingQueue.create({
    barberId: walkIn.barberId,
    date: walkIn.date,
    tokenNumber: walkIn.tokenNumber,
    sourceType: 'walkin',
    sourceId: walkInId,
    estimatedTime: walkIn.estimatedTime,
    estimatedStartTime,
    position,
    status: STATUS.WAITING
  });
  
  // Update walk-in with reference to queue
  walkIn.status = STATUS.WAITING;
  await walkIn.save();
  
  // Populate the source for notification
  queueEntry.sourceId = walkIn;
  
  // Send notification
  if (sendNotification) {
    await sendTokenAssignmentNotification(queueEntry);
  }
  
  return queueEntry;
};

/**
 * Move a queue entry to "ongoing" status
 * 
 * @param {string} queueEntryId - ID of the waiting queue entry
 * @returns {Promise<Object>} - The updated queue entry
 */
const startServingCustomer = async (queueEntryId) => {
  const queueEntry = await WaitingQueue.findById(queueEntryId);
  
  if (!queueEntry) {
    throw new Error('Queue entry not found');
  }
  
  if (queueEntry.status !== STATUS.WAITING) {
    throw new Error('Only waiting entries can be started');
  }
  
  // Update queue entry
  queueEntry.status = STATUS.ONGOING;
  await queueEntry.save();
  
  // Update the source (appointment or walk-in)
  if (queueEntry.sourceType === 'appointment') {
    await Appointment.findByIdAndUpdate(queueEntry.sourceId, {
      status: STATUS.ONGOING,
      startTime: new Date().toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    });
  } else {
    await WalkIn.findByIdAndUpdate(queueEntry.sourceId, {
      status: STATUS.ONGOING,
      startTime: new Date().toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    });
  }
  
  return queueEntry;
};

/**
 * Complete a service
 * 
 * @param {string} queueEntryId - ID of the waiting queue entry
 * @returns {Promise<Object>} - The updated queue entry
 */
const completeService = async (queueEntryId) => {
  const queueEntry = await WaitingQueue.findById(queueEntryId);
  
  if (!queueEntry) {
    throw new Error('Queue entry not found');
  }
  
  if (queueEntry.status !== STATUS.ONGOING) {
    throw new Error('Only ongoing entries can be completed');
  }
  
  // Update queue entry
  queueEntry.status = STATUS.COMPLETED;
  await queueEntry.save();
  
  // Update the source (appointment or walk-in)
  const endTime = new Date().toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  if (queueEntry.sourceType === 'appointment') {
    await Appointment.findByIdAndUpdate(queueEntry.sourceId, {
      status: STATUS.COMPLETED,
      endTime
    });
  } else {
    await WalkIn.findByIdAndUpdate(queueEntry.sourceId, {
      status: STATUS.COMPLETED,
      endTime
    });
  }
  
  // Update wait times for remaining customers
  await recalculateWaitTimes(queueEntry.barberId, queueEntry.date);
  
  return queueEntry;
};

/**
 * Recalculate estimated wait times for all customers in queue
 * 
 * @param {string} barberId - ID of the barber
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<void>}
 */
const recalculateWaitTimes = async (barberId, date) => {
  const queueEntries = await WaitingQueue.find({
    barberId,
    date,
    status: STATUS.WAITING
  }).sort('position');
  
  if (queueEntries.length === 0) {
    return;
  }
  
  // Get current time as the starting point
  let currentTime = new Date().toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  for (const entry of queueEntries) {
    // Update estimated start time
    entry.estimatedStartTime = currentTime;
    await entry.save();
    
    // Add estimated service time for next customer
    currentTime = addMinutesToTime(currentTime, entry.estimatedTime);
  }
};



module.exports = {
  addAppointmentToQueue,
  addWalkInToQueue,
  startServingCustomer,
  completeService,
  recalculateWaitTimes
};