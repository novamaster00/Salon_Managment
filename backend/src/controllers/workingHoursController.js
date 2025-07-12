const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const WorkingHours = require('../models/WorkingHours');
const {getMe }= require('../controllers/authController');
const User = require('../models/User');
const { default: mongoose } = require('mongoose');

// @desc    Create working hours
// @route   POST /api/working-hours
// @access  Private (Barber/Admin)
exports.createWorkingHours = asyncHandler(async (req, res, next) => {
  // If barber is creating their own hours
  if (req.user.role === 'barber') {
    req.body.barberId = req.user.id;
  }
  // Admin is creating hours for a barber
  else if (req.user.role === 'admin' && !req.body.barberId) {
    return next(new ErrorResponse('Please provide a barber ID', 400));
  }
  
  // Validate barber exists
  const barber = await User.findOne({
    _id: req.body.barberId,
    role: 'barber'
  });
  
  if (!barber) {
    return next(new ErrorResponse('Barber not found', 404));
  }
  
  // Check for duplicate (same barber, same date)
  const existingHours = await WorkingHours.findOne({
    barberId: req.body.barberId,
    date: req.body.date
  });
  
  if (existingHours) {
    return next(
      new ErrorResponse(
        'Working hours already defined for this date. Use update instead.',
        400
      )
    );
  }
  
  // Check if barber already has 7 working hours entries
  const count = await WorkingHours.countDocuments({ barberId: req.body.barberId });
  
  if (count >= 7) {
    // Return a specific status code and message to indicate limit reached
    return res.status(409).json({
      success: false,
      limitReached: true,
      message: 'You already have 7 working hours entries. Adding more will delete existing entries.'
    });
  }
  
  const workingHours = await WorkingHours.create(req.body);
  
  res.status(201).json({
    success: true,
    data: workingHours
  });
});

// @desc    Create working hours with confirmation (deletes old entries)
// @route   POST /api/working-hours/confirm-replace
// @access  Private (Barber/Admin)
exports.createWorkingHoursWithReplacement = asyncHandler(async (req, res, next) => {
  // If barber is creating their own hours
  if (req.user.role === 'barber') {
    req.body.barberId = req.user.id;
  }
  // Admin is creating hours for a barber
  else if (req.user.role === 'admin' && !req.body.barberId) {
    return next(new ErrorResponse('Please provide a barber ID', 400));
  }
  
  // Validate barber exists
  const barber = await User.findOne({
    _id: req.body.barberId,
    role: 'barber'
  });
  
  if (!barber) {
    return next(new ErrorResponse('Barber not found', 404));
  }
  
  // Delete all existing working hours for this barber
  await WorkingHours.deleteMany({ barberId: req.body.barberId });
  
  // Create new working hours
  const workingHours = await WorkingHours.create(req.body);
  
  res.status(201).json({
    success: true,
    replaced: true,
    data: workingHours
  });
});

// @desc    Get all working hours
// @route   GET /api/working-hours
// @access  Private
exports.getWorkingHours = asyncHandler(async (req, res, next) => {
  let query;
  console.log('Authorization Header:', req.headers.authorization);

  // Barbers can see only their working hours
  if (req.user.role === 'barber') {
    query = WorkingHours.find({ barberId: req.user.id });
  }
  // Admins and customers can see all barbers' hours
  else {
    query = WorkingHours.find();
  }
  
  // Filter by barber if requested
  if (req.body.barberId) {
    query = query.find({ barberId: req.body.barberId });
  }
  
  // Filter by date if requested
  if (req.body.date) {
    query = query.find({ date: req.body.date });
  }
  
  // Filter by date range if requested
  if (req.body.startDate && req.body.endDate) {
    query = query.find({
      date: { $gte: req.body.startDate, $lte: req.body.endDate }
    });
  }
  
  // Sort by date
  query = query.sort({ date: 1 });
  
  // Execute query
  const workingHours = await query.populate({
    path: 'barberId',
    select: 'name'
  });
  
  res.status(200).json({
    success: true,
    count: workingHours.length,
    data: workingHours
  });
});

// @desc    Get my working hours 
// @route   GET /api/working-hours/:id
// @access  Private
exports.getWorkingHoursById = asyncHandler(async (req, res, next) => {
  const workingHours = await WorkingHours.find({ barberId: req.user._id }).populate({
    path: 'barberId',
    select: 'name'
  });

  if (!workingHours || workingHours.length === 0) {
    return next(new ErrorResponse(`Working hours not found for user ${req.user._id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: workingHours
  });
});

// @desc    Update working hours
// @route   PUT /api/working-hours/:id
// @access  Private (Barber/Admin only)
exports.updateWorkingHours = asyncHandler(async (req, res, next) => {
  const { barberId ,date, ...updateFields } = req.body;

  const _id = req.body._id;
  
  console.log("request coming",_id);

  if (!barberId || !date) {
    return next(new ErrorResponse('barberId and date are required', 400));
  }

  // Find existing working hours using barberId and date
  let workingHours = await WorkingHours.findById( _id );

  if (!workingHours) {
    return next(new ErrorResponse(`Working hours not found for barber ${req.user.id} on ${date}`, 404));
  }

  // Authorization check
  if (
    req.user.role !== 'admin' &&
    req.user.id !== workingHours.barberId.toString()
  ) {
    return next(new ErrorResponse('Not authorized to update these working hours', 403));
  }

  // Update fields
  Object.assign(workingHours, updateFields);
  await workingHours.save();

  res.status(200).json({
    success: true,
    data: workingHours
  });
});

// @desc    Delete working hours
// @route   DELETE /api/working-hours/:id
// @access  Private (Barber/Admin only)
exports.deleteWorkingHours = asyncHandler(async (req, res, next) => {
  const workingHours = await WorkingHours.findById(req.body.id);
  
  if (!workingHours) {
    return next(new ErrorResponse(`Working hours not found with id ${req.body.id}`, 404));
  }
  
  // Check authorization
  if (
    req.user.role !== 'admin' &&
    req.user.id !== workingHours.barberId.toString()
  ) {
    return next(new ErrorResponse('Not authorized to delete these working hours', 403));
  }
  
  await workingHours.deleteOne();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get count of working hours for a barber
// @route   GET /api/working-hours/count/:barberId
// @access  Private
exports.getWorkingHoursCount = asyncHandler(async (req, res, next) => {
  // Use req.params.barberId or req.user.id (if barber checking own count)
  const barberId = req.params.barberId || req.user.id;
  
  // Check authorization if not admin and not checking own count
  if (req.user.role !== 'admin' && req.user.id !== barberId) {
    return next(new ErrorResponse('Not authorized to access this information', 403));
  }
  
  const count = await WorkingHours.countDocuments({ barberId });
  
  res.status(200).json({
    success: true,
    count,
    limitReached: count >= 7
  });
});

// @desc    Get working hours by barber and date
// @route   GET /api/working-hours/barber/:barberId/date/:date
// @access  Public
exports.getWorkingHoursByBarberAndDate = asyncHandler(async (req, res, next) => {
  const { barberId, date } = req.body;
  
  const workingHours = await WorkingHours.findOne({
    barberId,
    date
  }).populate({
    path: 'barberId',
    select: 'name'
  });
  
  if (!workingHours) {
    return next(new ErrorResponse(`No working hours found for this barber on ${date}`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: workingHours
  });
});