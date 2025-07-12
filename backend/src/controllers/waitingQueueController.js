const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const WaitingQueue = require('../models/WaitingQueue');
const Appointment = require('../models/Appointment');
const WalkIn = require('../models/WalkIn');
const User = require('../models/User');
const STATUS = require('../constants/status');
const {
  startServingCustomer,
  completeService,
  recalculateWaitTimes
} = require('../services/queueManagerService');

// @desc    Get waiting queue for a barber and date
// @route   GET /api/waiting-queue
// @access  Private
exports.getWaitingQueue = asyncHandler(async (req, res, next) => {
  const  barberId=req.body.barberId;
  const  date = req.body.date;
  const token= req.body.token;
  // Validate required fields
  if (!barberId || !date) {
    return next(new ErrorResponse('Please provide both barberId and date', 400));
  }
  
  // Check if user exists and is a barber trying to access another barber's queue
  if (req.user && req.user.role === 'barber' && req.user.id !== barberId) {
    return next(new ErrorResponse('Not authorized to access this queue', 403));
  }
  // Get the queue entries
  const queueEntries = await WaitingQueue.find({
    barberId,
    date,
    status: { $in: [STATUS.WAITING, STATUS.ONGOING] }
  }).sort('position');
  
  // Populate additional data for each entry
  const populatedQueue = await Promise.all(
    queueEntries.map(async (entry) => {
      let sourceData = null;
      
      if (entry.sourceType === 'appointment') {
        sourceData = await Appointment.findById(entry.sourceId)
          .populate({
            path: 'customerId',
            select: 'name email phoneNumber'
          }); 
      } else {
        sourceData = await WalkIn.findById(entry.sourceId);
      }
      
      return {
        ...entry.toObject(),
        sourceData
      };
    })
  );
  
  res.status(200).json({
    success: true,
    count: populatedQueue.length,
    data: populatedQueue
  });
});

// @desc    Start serving the next customer in queue
// @route   PUT /api/waiting-queue/next
// @access  Private (Barber only)
exports.startNextCustomer = asyncHandler(async (req, res, next) => {
  const { barberId, date } = req.body;
  
  // Validate required fields
  if (!barberId || !date) {
    return next(new ErrorResponse('Please provide both barberId and date', 400));
  }
  
  // Only barbers can start serving customers
  if (req.user.role === 'barber' && req.user.id !== barberId) {
    return next(new ErrorResponse('Not authorized to manage this queue', 403));
  }
  
  // Check if any customer is currently being served
  const currentlyServing = await WaitingQueue.findOne({
    barberId,
    date,
    status: STATUS.ONGOING
  });
  
  if (currentlyServing) {
    return next(
      new ErrorResponse(
        'Already serving a customer. Complete the current service first.',
        400
      )
    );
  }
  
  // Get the next customer in queue
  const nextInQueue = await WaitingQueue.findOne({
    barberId,
    date,
    status: STATUS.WAITING
  }).sort('position');
  
  if (!nextInQueue) {
    return next(new ErrorResponse('No customers waiting in the queue', 404));
  }
  
  // Start serving this customer
  const updatedEntry = await startServingCustomer(nextInQueue._id);
  
  // Get the source data
  let sourceData = null;
  if (updatedEntry.sourceType === 'appointment') {
    sourceData = await Appointment.findById(updatedEntry.sourceId)
      .populate({
        path: 'customerId',
        select: 'name email phoneNumber'
      });
  } else {
    sourceData = await WalkIn.findById(updatedEntry.sourceId);
  }
  
  res.status(200).json({
    success: true,
    data: {
      ...updatedEntry.toObject(),
      sourceData
    }
  });
});

// @desc    Complete the current service
// @route   PUT /api/waiting-queue/complete
// @access  Private (Barber only)
exports.completeCurrentService = asyncHandler(async (req, res, next) => {
  const { barberId, date } = req.body;
  
  // Validate required fields
  if (!barberId || !date) {
    return next(new ErrorResponse('Please provide both barberId and date', 400));
  }
  
  // Only barbers can complete services
  if (req.user.role === 'barber' && req.user.id !== barberId) {
    return next(new ErrorResponse('Not authorized to manage this queue', 403));
  }
  
  // Get the currently ongoing service
  const currentService = await WaitingQueue.findOne({
    barberId,
    date,
    status: STATUS.ONGOING
  });
  
  if (!currentService) {
    return next(new ErrorResponse('No ongoing service found', 404));
  }
  
  // Complete the service
  const completedEntry = await completeService(currentService._id);
  
  // Recalculate wait times for remaining customers
  await recalculateWaitTimes(barberId, date);
  
  res.status(200).json({
    success: true,
    data: completedEntry
  });
});

// @desc    Get all completed services for a date
// @route   GET /api/waiting-queue/completed
// @access  Private (Barber/Admin)
exports.getCompletedServices = asyncHandler(async (req, res, next) => {
  const { barberId, date } = req.body;
  
  // Validate required fields
  if (!barberId || !date) {
    return next(new ErrorResponse('Please provide both barberId and date', 400));
  }
  
  // If barber is accessing their own data
  if (req.user.role === 'barber' && req.user.id !== barberId) {
    return next(new ErrorResponse('Not authorized to access this data', 403));
  }
  
  // Get completed queue entries
  const completedEntries = await WaitingQueue.find({
    barberId,
    date,
    status: STATUS.COMPLETED
  }).sort('updatedAt');
  
  // Populate additional data
  const populatedEntries = await Promise.all(
    completedEntries.map(async (entry) => {
      let sourceData = null;
      
      if (entry.sourceType === 'appointment') {
        sourceData = await Appointment.findById(entry.sourceId)
          .populate({
            path: 'customerId',
            select: 'name email phoneNumber'
          });
      } else {
        sourceData = await WalkIn.findById(entry.sourceId);
      }
      
      return {
        ...entry.toObject(),
        sourceData
      };
    })
  );
  
  res.status(200).json({
    success: true,
    count: populatedEntries.length,
    data: populatedEntries
  });
});