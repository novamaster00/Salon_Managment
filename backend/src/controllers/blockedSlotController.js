const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const BlockedSlot = require('../models/BlockedSlot');
const User = require('../models/User');

// @desc    Create blocked slot
// @route   POST /api/blocked-slots
// @access  Private (Barber/Admin)
exports.createBlockedSlot = asyncHandler(async (req, res, next) => {
  // If barber is creating their own blocked slot
  if (req.user.role === 'barber') {
    req.body.barberId = req.user.id;
  }
  
  // Admin is creating a blocked slot for a barber
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
  
  // Check if barber already has 7 blocked slot entries
  const count = await BlockedSlot.countDocuments({ barberId: req.body.barberId });
  
  if (count >= 7) {
    // Return a specific status code and message to indicate limit reached
    return res.status(409).json({
      success: false,
      limitReached: true,
      message: 'You already have 7 blocked slot entries. Adding more will delete existing entries.'
    });
  }
  
  const blockedSlot = await BlockedSlot.create(req.body);
  
  res.status(201).json({
    success: true,
    data: blockedSlot
  });
});

// @desc    Create blocked slot with confirmation (deletes old entries)
// @route   POST /api/blocked-slots/confirm-replace
// @access  Private (Barber/Admin)
exports.createBlockedSlotWithReplacement = asyncHandler(async (req, res, next) => {
  // If barber is creating their own blocked slot
  if (req.user.role === 'barber') {
    req.body.barberId = req.user.id;
  }
  
  // Admin is creating a blocked slot for a barber
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
  
  // Delete all existing blocked slots for this barber
  await BlockedSlot.deleteMany({ barberId: req.body.barberId });
  
  // Create new blocked slot
  const blockedSlot = await BlockedSlot.create(req.body);
  
  res.status(201).json({
    success: true,
    replaced: true,
    data: blockedSlot
  });
});

// @desc    Get all blocked slots
// @route   GET /api/blocked-slots
// @access  Private
exports.getBlockedSlots = asyncHandler(async (req, res, next) => {
  let query;
  
  // Barbers can see only their blocked slots
  if (req.user.role === 'barber') {
    query = BlockedSlot.find({ barberId: req.user.id });
  }
  // Admins can see all blocked slots
  else {
    query = BlockedSlot.find();
  }
  
  if (req.query.barberId) {
    query = query.find({ barberId: req.query.barberId });
  }
  
  if (req.query.date) {
    query = query.find({ date: req.query.date });
  }
  
  // Sort by date and start time
  query = query.sort({ date: 1, startTime: 1 });
  
  // Execute query
  const blockedSlots = await query.populate({
    path: 'barberId',
    select: 'name'
  });
  
  res.status(200).json({
    success: true,
    count: blockedSlots.length,
    data: blockedSlots
  });
});

// @desc    Get single blocked slot
// @route   GET /api/blocked-slots/:id
// @access  Private
exports.getBlockedSlot = asyncHandler(async (req, res, next) => {
  const blockedSlot = await BlockedSlot.findById(req.body.id).populate({
    path: 'barberId',
    select: 'name'
  });
  
  if (!blockedSlot) {
    return next(new ErrorResponse(`Blocked slot not found with id ${req.body.id}`, 404));
  }
  
  // Check authorization for barbers
  if (
    req.user.role === 'barber' &&
    req.user.id !== blockedSlot.barberId.toString()
  ) {
    return next(new ErrorResponse('Not authorized to access this blocked slot', 403));
  }
  
  res.status(200).json({
    success: true,
    data: blockedSlot
  });
});

// @desc    Get count of blocked slots for a barber
// @route   GET /api/blocked-slots/count/:barberId
// @access  Private
exports.getBlockedSlotsCount = asyncHandler(async (req, res, next) => {
  // Use req.params.barberId or req.user.id (if barber checking own count)
  const barberId = req.params.barberId || req.user.id;
  
  // Check authorization if not admin and not checking own count
  if (req.user.role !== 'admin' && req.user.id !== barberId) {
    return next(new ErrorResponse('Not authorized to access this information', 403));
  }
  
  const count = await BlockedSlot.countDocuments({ barberId });
  
  res.status(200).json({
    success: true,
    count,
    limitReached: count >= 7
  });
});

// @desc    Update blocked slot
// @route   PUT /api/blocked-slots/:id
// @access  Private (Barber/Admin only)
exports.updateBlockedSlot = asyncHandler(async (req, res, next) => {
  const id = req.params.id; // Get ID from URL params instead of request body
  
  let blockedSlot = await BlockedSlot.findById(id);
  
  if (!blockedSlot) {
    return next(new ErrorResponse(`Blocked slot not found with id ${id}`, 404));
  }
  
  // Check authorization
  if (
    req.user.role !== 'admin' &&
    req.user.id !== blockedSlot.barberId.toString()
  ) {
    return next(new ErrorResponse('Not authorized to update this blocked slot', 403));
  }
  
  blockedSlot = await BlockedSlot.findByIdAndUpdate(
    id,
    req.body, // The rest of the data still comes from the request body
    {
      new: true,
      runValidators: true
    }
  );
  
  res.status(200).json({
    success: true,
    data: blockedSlot
  });
});

// @desc    Delete blocked slot
// @route   DELETE /api/blocked-slots/:id
// @access  Private (Barber/Admin only)
exports.deleteBlockedSlot = asyncHandler(async (req, res, next) => {
  const blockedSlot = await BlockedSlot.findById(req.body.id);
  
  if (!blockedSlot) {
    return next(new ErrorResponse(`Blocked slot not found with id ${req.body.id}`, 404));
  }
  
  // Check authorization
  if (
    req.user.role !== 'admin' &&
    req.user.id !== blockedSlot.barberId.toString()
  ) {
    return next(new ErrorResponse('Not authorized to delete this blocked slot', 403));
  }
  
  await blockedSlot.deleteOne();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});