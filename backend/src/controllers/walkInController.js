const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const WalkIn = require('../models/WalkIn');
const WaitingQueue = require('../models/WaitingQueue');
const User = require('../models/User');
const STATUS = require('../constants/status');
const { addMinutesToTime } = require('../utils/dateUtils');
const { 
  sendWalkInNotification,
  notifyBarberAboutWalkIn
} = require('../services/notificationService');
const { 
  findNextAvailableSlot 
} = require('../services/findAvailableTimeSlot');
const { 
  addWalkInToQueue 
} = require('../services/queueManagerService');

// Service durations in minutes (simplified example)
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

// Default duration if service not found
const DEFAULT_DURATION = 30;

// @desc    Create new walk-in
// @route   POST /api/WalkIns
// @access  Public
exports.createWalkIn = asyncHandler(async (req, res, next) => {
  // Calculate estimated time based on service
  const serviceKey = req.body.service.toLowerCase().replace(/\s+/g, '-');
  const estimatedTime = SERVICE_DURATIONS[serviceKey] || DEFAULT_DURATION;
  req.body.estimatedTime = estimatedTime;
  
  // Validate barber exists
  const barber = await User.findOne({ 
    _id: req.body.barberId,
    role: 'barber'
  });
  
  if (!barber) {
    return next(new ErrorResponse('Barber not found', 404));
  }
  
  // Find next available time slot
  const nextSlot = await findNextAvailableSlot(
    req.body.barberId,
    req.body.date,
    req.body.arrivalTime,
    estimatedTime
  );
  
  if (!nextSlot) {
    return next(
      new ErrorResponse(
        'Walk-in denied. No available slots for today. Try again tomorrow.',
        400
      )
    );
  }
  
  // Set start and end time
  req.body.startTime = nextSlot.start;
  req.body.endTime = nextSlot.end;
  
  // Set initial status
  req.body.status = STATUS.WAITING;
  
  // Create walk-in - FIX: Use a different variable name here to avoid conflict
  const newWalkIn = await WalkIn.create(req.body);
  
  // Add to waiting WalkIn
  await addWalkInToQueue(newWalkIn._id);
  
  // Send notifications
  await sendWalkInNotification(newWalkIn);
  await notifyBarberAboutWalkIn(newWalkIn, barber);
  
  res.status(201).json({
    success: true,
    data: newWalkIn
  });
});

// @desc    Get all walk-ins
// @route   GET /api/WalkIns
// @access  Private (Admin/Barber)
exports.getWalkIns = asyncHandler(async (req, res, next) => {
  let query;
  
  // Allow barbers to see only their walk-ins
  if (req.user.role === 'barber') {
    query = WalkIn.find({ barberId: req.user.id });
  }
  // Admins can see all walk-ins
  else {
    query = WalkIn.find();
  }
  
  // Filter by date if provided
  if (req.body.date) {
    query = query.find({ date: req.body.date });
  }
  
  // Filter by status if provided
  if (req.body.status) {
    query = query.find({ status: req.body.status });
  }
  
  // Sort by date and arrival time
  query = query.sort({ date: 1, arrivalTime: 1 });
  
  // Execute query
  const WalkIns = await query.populate({
    path: 'barberId',
    select: 'name'
  });
  
  res.status(200).json({
    success: true,
    count: WalkIns.length,
    data: WalkIns
  });
});

// @desc    Get single walk-in
// @route   GET /api/WalkIns/:id
// @access  Private (Admin/Barber)
exports.getWalkIn = asyncHandler(async (req, res, next) => {
  const WalkIn = await WalkIn.findById(req.body.id).populate({
    path: 'barberId',
    select: 'name'
  });
  
  if (!WalkIn) {
    return next(new ErrorResponse(`Walk-in not found with id ${req.body.id}`, 404));
  }
  
  // Check authorization
  if (
    req.user.role !== 'admin' &&
    req.user.id !== WalkIn.barberId.toString()
  ) {
    return next(new ErrorResponse('Not authorized to access this walk-in', 403));
  }
  
  res.status(200).json({
    success: true,
    data: WalkIn
  });
});

// @desc    Update walk-in status
// @route   PUT /api/WalkIns/:id
// @access  Private (Barber/Admin only)
exports.updateWalkInStatus = asyncHandler(async (req, res, next) => {
  let Queue = await WaitingQueue.findById(req.body._id);
  let Walkin = await WalkIn.findById(req.body.walkinId);
  
  if (!Queue) {
    return next(new ErrorResponse(`Walk-in not found with id ${req.body.Queue}`, 404));
  }
  if(!Walkin){
    return next(new ErrorResponse(` can not find the walkin entry with id ${req.body.walkinId}`,404));
  }
  
  // Check authorization
  if (
    req.user.role !== 'admin' &&
    req.user.id !== Queue.barberId.toString()
  ) {
    return next(new ErrorResponse('Not authorized to update this walk-in', 403));
  }
  
  // Get the new status
  const { status } = req.body;
  
  if (!Object.values(STATUS).includes(status)) {
    return next(new ErrorResponse('Invalid status value', 400));
  }
  
  // Update the status
  Queue.status = status;
  Queue = await Queue.save();
  Walkin.status = status;
  Walkin = await Walkin.save(); // Added this line to save the Walkin
  
  res.status(200).json({
    success: true,
    data: Queue
  });
});