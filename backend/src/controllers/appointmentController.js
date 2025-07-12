const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const WaitingQueue = require('../models/WaitingQueue');
const STATUS = require('../constants/status');
const { 
  sendAppointmentStatusNotification
} = require('../services/notificationService');
const { addMinutesToTime } = require('../utils/dateUtils');
const { 
  isTimeSlotAvailable, 
  findNextAvailableSlot 
} = require('../services/findAvailableTimeSlot');
const { 
  addAppointmentToQueue 
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

// @desc    Check availability of a time slot
// @route   POST /api/appointments/available-slots
// @access  Private
exports.checkAvailability = asyncHandler(async (req, res, next) => {
  const { barberId, date, requestedTime, service } = req.body;
  
  // Calculate estimated time based on service
  const serviceKey = service.toLowerCase().replace(/\s+/g, '-');
  const estimatedTime = SERVICE_DURATIONS[serviceKey] || DEFAULT_DURATION;
  
  // Calculate end time based on requested time
  const startTime = requestedTime;
  const endTime = addMinutesToTime(startTime, estimatedTime);
  
  // Check if the time slot is available
  const isAvailable = await isTimeSlotAvailable(
    barberId,
    date,
    startTime,
    endTime
  );
  
  if (!isAvailable) {
    // Find next available slot
    const nextSlot = await findNextAvailableSlot(
      barberId,
      date,
      startTime,
      estimatedTime
    );
    
    if (!nextSlot) {
      return next(
        new ErrorResponse(
          `No available slots for ${date}. Please try another date.`,
          400
        )
      );
    }
    
    return res.status(200).json({
      success: false,
      message: 'Requested time slot is not available',
      suggestedSlot: nextSlot,
      isAvailable: false
    });
  }

  // If slot is available, return confirmation
  res.status(200).json({
    success: true,
    message: 'Time slot is available',
    confirmedSlot: {
      startTime,
      endTime,
      date,
      barberId,
      service,
      estimatedTime
    },
    isAvailable: true
  });
});

// @desc    Create new appointment
// @route   POST /api/appointments
// @access  Private
exports.createAppointment = asyncHandler(async (req, res, next) => {
  // Add user ID to request body
  req.body.customerId = req.user.id;
  
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

  const customer = await User.findById(req.user.id);

  // Embed customer info into the appointment
  req.body.customerInfo = {
    name: customer.name,
    email: customer.email,
    phoneNumber: customer.phoneNumber
  };

  // Calculate start and end time based on requested time
  const startTime = req.body.requestedTime;
  const endTime = addMinutesToTime(startTime, estimatedTime);
  
  // Perform final availability check before creating appointment
  const isAvailable = await isTimeSlotAvailable(
    req.body.barberId,
    req.body.date,
    startTime,
    endTime
  );
  
  if (!isAvailable) {
    // Find next available slot
    const nextSlot = await findNextAvailableSlot(
      req.body.barberId,
      req.body.date,
      startTime,
      estimatedTime
    );
    
    if (!nextSlot) {
      return next(
        new ErrorResponse(
          `No available slots for ${req.body.date}. Please try another date.`,
          400
        )
      );
    }
    
    return res.status(409).json({
      success: false,
      message: 'Requested time slot is not available',
      suggestedSlot: nextSlot
    });
  }

  req.body.startTime = startTime;
  req.body.endTime = endTime;
  
  // Set initial status
  req.body.status = STATUS.PENDING_APPROVAL;
  
  // Create appointment
  const appointment = await Appointment.create(req.body);
  
  res.status(201).json({
    success: true,
    data: appointment
  });
});

// @desc    Confirm a suggested appointment time by customer
// @route   PUT /api/appointments/confirm
// @access  Private (Customer)
exports.confirmSuggestedAppointment = asyncHandler(async (req, res, next) => {
  const { id } = req.body;

  const appointment = await Appointment.findById(id);

  if (!appointment) {
    return next(new ErrorResponse(`Appointment not found with id ${id}`, 404));
  }

  // Only customer who created it can update it
  if (req.user.role !== 'customer' || req.user.id !== appointment.customerId.toString()) {
    return next(new ErrorResponse('Not authorized to update this appointment', 403));
  }

  // Prevent changing status of finalized appointments
  if (appointment.status !== STATUS.PENDING_APPROVAL && appointment.status !== STATUS.SUGGESTED) {
    return next(new ErrorResponse('Appointment cannot be updated at this stage', 400));
  }

  // Update requested time and status
  appointment.status = STATUS.PENDING_APPROVAL_BARBER;

  await appointment.save();

  res.status(200).json({
    success: true,
    data: appointment,
    message: 'Appointment updated and sent for approval'
  });
});

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Private (Admin/Barber)
exports.getAppointments = asyncHandler(async (req, res, next) => {
  let query;
  
  // Allow barbers to see only their appointments
  if (req.user.role === 'barber') {
    query = Appointment.find({ barberId: req.user.id });
  } 
  // Customers can see only their appointments
  else if (req.user.role === 'customer') {
    query = Appointment.find({ customerId: req.user.id });
  }
  // Admins can see all appointments
  else {
    query = Appointment.find();
  }
  
  // Filter by date if provided
  if (req.body.date) {
    query = query.find({ date: req.body.date });
  }
  
  // Filter by status if provided
  if (req.body.status) {
    query = query.find({ status: req.body.status });
  }
  
  // Sort by date and time
  query = query.sort({ date: 1, requestedTime: 1 });
  
  // Execute query
  const appointments = await query
    .populate({
      path: 'customerId',
      select: 'name email phoneNumber'
    })
    .populate({
      path: 'barberId',
      select: 'name'
    });
  
  res.status(200).json({
    success: true,
    count: appointments.length,
    data: appointments
  });
});

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private
exports.getAppointment = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.body.id)
    .populate({
      path: 'customerId',
      select: 'name email phoneNumber'
    })
    .populate({
      path: 'barberId',
      select: 'name'
    });
  
  if (!appointment) {
    return next(new ErrorResponse(`Appointment not found with id ${req.body.id}`, 404));
  }
  
  // Check if user is authorized to view this appointment
  if (
    req.user.role !== 'admin' &&
    req.user.id !== appointment.customerId._id.toString() &&
    req.user.id !== appointment.barberId._id.toString()
  ) {
    return next(new ErrorResponse('Not authorized to access this appointment', 403));
  }
  
  res.status(200).json({
    success: true,
    data: appointment
  });
});

// @desc    Update appointment status
// @route   PUT /api/appointments/:id
// @access  Private (Barber/Admin only)
exports.updateAppointmentStatus = asyncHandler(async (req, res, next) => {

  let appointment = await Appointment.findById(req.body.appointmentId);
  let Queue = await WaitingQueue.findById(req.body._id);
  if (!Queue) {
    return next(new ErrorResponse(`Appointment not found with id ${req.body._id}`, 404));
  }
  
  // Check authorization
  if (
    req.user.role !== 'admin' &&
    req.user.id !== appointment.barberId.toString()
  ) {
    return next(new ErrorResponse('Not authorized to update this appointment', 403));
  }
  
  // Get the new status
  const { status } = req.body;
  
  if (!Object.values(STATUS).includes(status)) {
    return next(new ErrorResponse('Invalid status value', 400));
  }
  
  // Handle different status updates
  if (status === STATUS.APPROVED) {
    // Calculate start and end times if not set
    if (!appointment.startTime) {
      appointment.startTime = appointment.requestedTime;
      appointment.endTime = addMinutesToTime(
        appointment.requestedTime, 
        appointment.estimatedTime
      );
    }
    
    // Add to waiting queue if approved
    await addAppointmentToQueue(appointment._id);
  }
  
  // Update the status
  appointment.status = status;
  
  appointment = await appointment.save();
  
  // Send notification
  const customer = await User.findById(appointment.customerId);
  if (customer) {
    await sendAppointmentStatusNotification(appointment, customer, status);
  }
  
 if (status === STATUS.ONGOING || status === STATUS.REJECTED || status === STATUS.COMPLETED || status === STATUS.WAITING || status === STATUS.PENDING_APPROVAL_BARBER ) {
  Queue.status = status;
  Queue = await Queue.save();
 }
  res.status(200).json({
    success: true,
    data: appointment
  });
});

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Private
exports.deleteAppointment = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.body.id);
  
  if (!appointment) {
    return next(new ErrorResponse(`Appointment not found with id ${req.body.id}`, 404));
  }
  
  // Check authorization
  if (
    req.user.role !== 'admin' &&
    req.user.id !== appointment.customerId.toString() &&
    req.user.id !== appointment.barberId.toString()
  ) {
    return next(new ErrorResponse('Not authorized to delete this appointment', 403));
  }
  
  // Only allow deletion of pending appointments
  if (appointment.status !== STATUS.PENDING_APPROVAL) {
    return next(
      new ErrorResponse(
        'Cannot delete an appointment that has been approved or is in progress',
        400
      )
    );
  }
  
  await appointment.deleteOne();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

//@dec  REJECT an appointment
//@route  PUT /api/appointments/:id/reject
exports.rejectAppointment = asyncHandler(async (req, res, next) => {
  req.body.status = STATUS.REJECTED;
  req.body.appointmentId = req.params.id;

  return exports.updateAppointmentStatus(req, res, next);
});

// @desc    Approve an appointment
// @route   PUT /api/appointments/:id/approve
// @access  Private (Barber/Admin)
exports.approveAppointment = asyncHandler(async (req, res, next) => {
  req.body.status = STATUS.APPROVED;
  req.body.appointmentId = req.params.id;

  return exports.updateAppointmentStatus(req, res, next);
});