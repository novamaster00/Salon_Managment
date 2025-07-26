const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const WaitingQueue = require('../models/WaitingQueue');
const STATUS = require('../constants/status');
<<<<<<< HEAD
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

=======
const {
  sendAppointmentStatusNotification
} = require('../services/notificationService');
const AtomicReservationService = require('../services/atomicReservationService');
const { addMinutesToTime } = require('../utils/dateUtils');
const {
  isTimeSlotAvailable,
  findNextAvailableSlot
} = require('../services/findAvailableTimeSlot');
const {
  addAppointmentToQueue
} = require('../services/queueManagerService');

const {
  sendAppointmentConfirmationEmail,
  sendAppointmentApprovedEmail,
  sendAppointmentRejectedEmail
} = require('../utils/emailSender');


const calculateEndTime = (startTime, duration) => {
  return addMinutesToTime(startTime, duration);
};

>>>>>>> 0011b2f (trying to add into Production ready code to Production Branch)
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
<<<<<<< HEAD
  
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
=======

  console.log("\nbarberId ", barberId, "\ndate ", date, "\nrequestedTime ", requestedTime, "\nservice ", service, "\n");

  // Calculate estimated time based on service
  const serviceKey = service.toLowerCase().replace(/\s+/g, '-');
  const estimatedTime = SERVICE_DURATIONS[serviceKey] || DEFAULT_DURATION;

  // Calculate start and end time
  const startTime = requestedTime;
  const endTime = calculateEndTime(startTime, estimatedTime);

  // Check if slot is available
  const isAvailable = await isTimeSlotAvailable(barberId, date, startTime, endTime);
  if (!isAvailable) {
>>>>>>> 0011b2f (trying to add into Production ready code to Production Branch)
    const nextSlot = await findNextAvailableSlot(
      barberId,
      date,
      startTime,
      estimatedTime
    );
<<<<<<< HEAD
    
=======
>>>>>>> 0011b2f (trying to add into Production ready code to Production Branch)
    if (!nextSlot) {
      return next(
        new ErrorResponse(
          `No available slots for ${date}. Please try another date.`,
          400
        )
      );
    }
<<<<<<< HEAD
    
=======
>>>>>>> 0011b2f (trying to add into Production ready code to Production Branch)
    return res.status(200).json({
      success: false,
      message: 'Requested time slot is not available',
      suggestedSlot: nextSlot,
      isAvailable: false
    });
  }

<<<<<<< HEAD
  // If slot is available, return confirmation
  res.status(200).json({
    success: true,
    message: 'Time slot is available',
=======
  // Atomically reserve the slot
  const reservation = await AtomicReservationService.reserveTimeSlot(
    barberId,
    date,
    startTime,
    endTime,
    'appointment',
    req.user.email
  );

  if (!reservation.success) {
    return res.status(400).json({
      success: false,
      message: reservation.message || 'Failed to reserve slot'
    });
  }

  // Return success response
  return res.status(200).json({
    success: true,
    message: 'Time slot is available and reserved',
>>>>>>> 0011b2f (trying to add into Production ready code to Production Branch)
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

<<<<<<< HEAD
=======

>>>>>>> 0011b2f (trying to add into Production ready code to Production Branch)
// @desc    Create new appointment
// @route   POST /api/appointments
// @access  Private
exports.createAppointment = asyncHandler(async (req, res, next) => {
  // Add user ID to request body
  req.body.customerId = req.user.id;
<<<<<<< HEAD
  
=======

>>>>>>> 0011b2f (trying to add into Production ready code to Production Branch)
  // Calculate estimated time based on service
  const serviceKey = req.body.service.toLowerCase().replace(/\s+/g, '-');
  const estimatedTime = SERVICE_DURATIONS[serviceKey] || DEFAULT_DURATION;
  req.body.estimatedTime = estimatedTime;
<<<<<<< HEAD
  
  // Validate barber exists
  const barber = await User.findOne({ 
    _id: req.body.barberId,
    role: 'barber'
  });
  
=======

  // Validate barber exists
  const barber = await User.findOne({
    _id: req.body.barberId,
    role: 'barber'
  });

>>>>>>> 0011b2f (trying to add into Production ready code to Production Branch)
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
<<<<<<< HEAD
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
=======
  // const endTime = addMinutesToTime(startTime, estimatedTime);

  // Perform final availability check before creating appointment
  // Validate that user has a valid reservation
  const hasValidReservation = await AtomicReservationService.validateReservation(
    req.body.barberId,
    req.body.date,
    startTime,
    req.user.email
  );

  if (!hasValidReservation) {
    return res.status(400).json({
      success: false,
      message: 'No valid reservation found. Please check availability first.'
    });
  }

  // Calculate end time
  const endTime = calculateEndTime(startTime, estimatedTime);

  // Remove the reservation since appointment is created
  await AtomicReservationService.removeReservation(
    req.body.barberId,
    req.body.date,
    startTime,
    req.user.email
  );

  req.body.startTime = startTime;
  req.body.endTime = endTime;

  // Set initial status
  req.body.status = STATUS.PENDING_APPROVAL;

  // Create appointment
  const appointment = await Appointment.create(req.body);

  //Send appointment confirmation email
  try {
    const appointmentDetails = {
      date: appointment.date,
      requestedTime: appointment.requestedTime,
      service: appointment.service,
      estimatedTime: appointment.estimatedTime,
      appointmentId: appointment._id.toString().slice(-6).toUpperCase()
    };

    await sendAppointmentConfirmationEmail(
      customer.email,
      appointmentDetails,
      customer.name
    );
    console.log('✅ Appointment confirmation email sent successfully');
  } catch (emailError) {
    console.error('❌ Failed to send appointment confirmation email:', emailError);
    // Don't fail the appointment creation if email fails
  }

  res.status(201).json({
    success: true,
    data: appointment,
    messsage: 'Appointment Successfully created! check your email for confirmation.'
>>>>>>> 0011b2f (trying to add into Production ready code to Production Branch)
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
<<<<<<< HEAD
  
  // Allow barbers to see only their appointments
  if (req.user.role === 'barber') {
    query = Appointment.find({ barberId: req.user.id });
  } 
=======

  // Allow barbers to see only their appointments
  if (req.user.role === 'barber') {
    query = Appointment.find({ barberId: req.user.id });
  }
>>>>>>> 0011b2f (trying to add into Production ready code to Production Branch)
  // Customers can see only their appointments
  else if (req.user.role === 'customer') {
    query = Appointment.find({ customerId: req.user.id });
  }
  // Admins can see all appointments
  else {
    query = Appointment.find();
  }
<<<<<<< HEAD
  
=======

>>>>>>> 0011b2f (trying to add into Production ready code to Production Branch)
  // Filter by date if provided
  if (req.body.date) {
    query = query.find({ date: req.body.date });
  }
<<<<<<< HEAD
  
=======

>>>>>>> 0011b2f (trying to add into Production ready code to Production Branch)
  // Filter by status if provided
  if (req.body.status) {
    query = query.find({ status: req.body.status });
  }
<<<<<<< HEAD
  
  // Sort by date and time
  query = query.sort({ date: 1, requestedTime: 1 });
  
=======

  // Sort by date and time
  query = query.sort({ date: 1, requestedTime: 1 });

>>>>>>> 0011b2f (trying to add into Production ready code to Production Branch)
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
<<<<<<< HEAD
  
=======

>>>>>>> 0011b2f (trying to add into Production ready code to Production Branch)
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
<<<<<<< HEAD
  
  if (!appointment) {
    return next(new ErrorResponse(`Appointment not found with id ${req.body.id}`, 404));
  }
  
=======

  if (!appointment) {
    return next(new ErrorResponse(`Appointment not found with id ${req.body.id}`, 404));
  }

>>>>>>> 0011b2f (trying to add into Production ready code to Production Branch)
  // Check if user is authorized to view this appointment
  if (
    req.user.role !== 'admin' &&
    req.user.id !== appointment.customerId._id.toString() &&
    req.user.id !== appointment.barberId._id.toString()
  ) {
    return next(new ErrorResponse('Not authorized to access this appointment', 403));
  }
<<<<<<< HEAD
  
=======

>>>>>>> 0011b2f (trying to add into Production ready code to Production Branch)
  res.status(200).json({
    success: true,
    data: appointment
  });
});

// @desc    Update appointment status
// @route   PUT /api/appointments/:id
// @access  Private (Barber/Admin only)
exports.updateAppointmentStatus = asyncHandler(async (req, res, next) => {
<<<<<<< HEAD

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
=======
  console.log("\n=== UPDATE APPOINTMENT STATUS CONTROLLER ===");
  console.log("Request body:", req.body);
  console.log("Request params:", req.params);
  console.log("User:", req.user ? { id: req.user.id, role: req.user.role } : 'No user');

  const appointmentId = req.body.appointmentId;
  console.log("AppointmentID from body:", appointmentId);

  if (!appointmentId) {
    console.log("ERROR: No appointmentId in request body");
    return next(new ErrorResponse('Appointment ID is required in request body', 400));
  }

  let appointment;
  try {
    appointment = await Appointment.findById(appointmentId);
    console.log("Database query result:", appointment ? 'Found' : 'Not found');
  } catch (error) {
    console.log("Database error:", error.message);
    return next(new ErrorResponse('Invalid appointment ID format', 400));
  }

  if (!appointment) {
    console.log(`Appointment not found with ID: ${appointmentId}`);
    return next(new ErrorResponse(`Appointment not found with id ${appointmentId}`, 404));
  }

  console.log("Found appointment:", {
    id: appointment._id,
    status: appointment.status,
    barberId: appointment.barberId
  });

  // Authorization check
  if (req.user.role !== 'admin' && req.user.id !== appointment.barberId.toString()) {
    console.log("Authorization failed:");
    console.log("User ID:", req.user.id);
    console.log("Appointment barber ID:", appointment.barberId.toString());
    console.log("User role:", req.user.role);
    return next(new ErrorResponse('Not authorized to update this appointment', 403));
  }

  const { status } = req.body;
  console.log("Requested status change to:", status);

  if (!Object.values(STATUS).includes(status)) {
    console.log("Invalid status:", status);
    console.log("Valid statuses:", Object.values(STATUS));
    return next(new ErrorResponse('Invalid status value', 400));
  }

  console.log("===========================================\n");

  const oldStatus = appointment.status;

  // Special handling for WAITING status
  if (status === STATUS.WAITING) {
    console.log("Processing WAITING status change...");
    
    // First, ensure the appointment is approved
    if (oldStatus !== STATUS.APPROVED) {
      console.log("Appointment must be approved before adding to queue. Current status:", oldStatus);
      return next(new ErrorResponse('Appointment must be approved before it can be set to waiting', 400));
    }
    
    try {
      // Use the addAppointmentToQueue function which handles the status change
      const queueEntry = await addAppointmentToQueue(appointment, true);
      console.log("Successfully added to queue:", queueEntry);
      
      // Refresh the appointment data after queue addition
      appointment = await Appointment.findById(appointmentId);
      
    } catch (queueError) {
      console.log("Failed to add to queue:", queueError.message);
      return next(new ErrorResponse(`Failed to add appointment to queue: ${queueError.message}`, 500));
    }
  } else {
    // Handle other status changes normally
    appointment.status = status;

    if (status === STATUS.ONGOING) {
      appointment.actualStartTime = new Date();
    }

    if (status === STATUS.COMPLETED) {
      appointment.actualEndTime = new Date();
      if (appointment.actualStartTime) {
        appointment.actualDuration = Math.round((appointment.actualEndTime - appointment.actualStartTime) / (1000 * 60));
      }
    }

    if (status === STATUS.APPROVED) {
      if (!appointment.startTime) {
        appointment.startTime = appointment.requestedTime;
        appointment.endTime = addMinutesToTime(
          appointment.requestedTime,
          appointment.estimatedTime
        );
      }
    }

    console.log("Before save - status:", appointment.status);
    appointment.status=status;
    appointment = await appointment.save();
    console.log("After save - status:", appointment.status);
    try {
      console.log("🚀 Auto-adding approved appointment to queue...");
      const queueEntry = await addAppointmentToQueue(appointment, true);
      console.log("✅ Successfully added to queue:", queueEntry);
      
      // Refresh the appointment data after queue addition
      appointment = await Appointment.findById(appointmentId);
      console.log("🔄 Appointment status after queue addition:", appointment.status);
      
    } catch (queueError) {
      console.log("❌ Failed to add approved appointment to queue:", queueError.message);
      console.error("Queue error details:", queueError);
      // Don't fail the approval, just log the error
    }
  }

  console.log(`Appointment status updated from ${oldStatus} to ${appointment.status}`);

  // Handle email notifications for approved/rejected status
  try {
    const customer = await User.findById(appointment.customerId);
    
    if (status === STATUS.APPROVED) {
      try {
        const barber = await User.findById(appointment.barberId);
        const appointmentDetails = {
          date: appointment.date,
          startTime: appointment.startTime,
          requestedTime: appointment.requestedTime,
          service: appointment.service,
          estimatedTime: appointment.estimatedTime,
          appointmentId: appointment._id.toString().slice(-6).toUpperCase(),
          tokenNumber: appointment.tokenNumber
        };

        await sendAppointmentApprovedEmail(
          customer.email,
          appointmentDetails,
          customer.name,
          barber.name
        );
        console.log("✅ Appointment approved email sent successfully");
      } catch (emailError) {
        console.error("❌ Failed to send approval email:", emailError);
      }
    } else if (status === STATUS.REJECTED) {
      try {
        const appointmentDetails = {
          date: appointment.date,
          requestedTime: appointment.requestedTime,
          service: appointment.service,
          appointmentId: appointment._id.toString().slice(-6).toUpperCase()
        };

        await sendAppointmentRejectedEmail(
          customer.email,
          appointmentDetails,
          customer.name
        );
        console.log("✅ Appointment rejection email sent successfully");
      } catch (emailError) {
        console.error("❌ Failed to send rejection email:", emailError);
      }
    }
  } catch (error) {
    console.log("❌ Failed to send notification:", error.message);
  }

  // Update queue status if queue ID is provided
  if (req.body._id && req.body._id.trim() !== '') {
    try {
      const queue = await WaitingQueue.findById(req.body._id);
      if (queue) {
        console.log("Current queue status:", queue.status);
        queue.status = status;

        if (status === STATUS.ONGOING) {
          queue.actualStartTime = new Date();
        }

        if (status === STATUS.COMPLETED) {
          queue.actualEndTime = new Date();
          queue.completedAt = new Date();
        }

        await queue.save();
        console.log("Queue status updated to:", queue.status);
      }
    } catch (error) {
      console.log("Failed to update queue status:", error.message);
    }
  }

  // Send general status notification
  try {
    const customer = await User.findById(appointment.customerId);
    if (customer) {
      await sendAppointmentStatusNotification(appointment, customer, appointment.status);
      console.log("Notification sent successfully");
    }
  } catch (error) {
    console.log("Failed to send notification:", error.message);
  }

  res.status(200).json({
    success: true,
    data: appointment,
    message: `Appointment ${appointment.status.toLowerCase()} successfully`
>>>>>>> 0011b2f (trying to add into Production ready code to Production Branch)
  });
});

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Private
exports.deleteAppointment = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.body.id);
<<<<<<< HEAD
  
  if (!appointment) {
    return next(new ErrorResponse(`Appointment not found with id ${req.body.id}`, 404));
  }
  
=======

  if (!appointment) {
    return next(new ErrorResponse(`Appointment not found with id ${req.body.id}`, 404));
  }

>>>>>>> 0011b2f (trying to add into Production ready code to Production Branch)
  // Check authorization
  if (
    req.user.role !== 'admin' &&
    req.user.id !== appointment.customerId.toString() &&
    req.user.id !== appointment.barberId.toString()
  ) {
    return next(new ErrorResponse('Not authorized to delete this appointment', 403));
  }
<<<<<<< HEAD
  
=======

>>>>>>> 0011b2f (trying to add into Production ready code to Production Branch)
  // Only allow deletion of pending appointments
  if (appointment.status !== STATUS.PENDING_APPROVAL) {
    return next(
      new ErrorResponse(
        'Cannot delete an appointment that has been approved or is in progress',
        400
      )
    );
  }
<<<<<<< HEAD
  
  await appointment.deleteOne();
  
=======

  await appointment.deleteOne();

>>>>>>> 0011b2f (trying to add into Production ready code to Production Branch)
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
<<<<<<< HEAD
  req.body.status = STATUS.APPROVED;
  req.body.appointmentId = req.params.id;

  return exports.updateAppointmentStatus(req, res, next);
});
=======
  console.log("Approving appointment:", req.params.id);
  console.log("Request Body before change:", req.body);
  req.body.status = STATUS.APPROVED;
  req.body.appointmentId = req.params.id;
  console.log("Request Body after change:", req.body);
  console.log("STATUS.APPROVED value:", STATUS.APPROVED);

  return exports.updateAppointmentStatus(req, res, next);
});

exports.verifyEmail = asyncHandler(async (req, res, next) => {
  const { token } = req.query;

  console.log('🔍 Email verification started with token:', token);

  if (!token) {
    console.log('❌ No verification token provided');
    return res.status(400).json({
      success: false,
      message: 'Verification token is required'
    });
  }

  try {
    // Verify and decode the JWT token
    console.log('🔓 Verifying JWT token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token verified for email:', decoded.email);

    // Find user with matching email and verification token
    console.log('🔍 Looking for user with email:', decoded.email);
    const user = await User.findOne({
      email: decoded.email,
      verifyToken: token,
      isVerified: false
    });

    if (!user) {
      console.log('❌ User not found or already verified');
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token or user already verified'
      });
    }

    console.log('👤 User found:', user.email, 'ID:', user._id);

    // Update user verification status
    console.log('✅ Marking user as verified...');
    user.isVerified = true;
    user.verifyToken = undefined; // Remove the verification token
    await user.save();

    console.log('🎉 User verification completed for:', user.email);

    // Success response
    res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now log in.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        phoneNumber: user.phoneNumber
      }
    });

  } catch (error) {
    console.error('❌ Email verification error:', error.message);
    console.error('Full verification error:', error);

    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({
        success: false,
        message: 'Verification token has expired. Please register again.'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Email verification failed',
      error: error.message
    });
  }
});

// Optional: Add a function to resend verification email
exports.resendVerificationEmail = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  console.log('🔄 Resending verification email for:', email);

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }

  try {
    // Find unverified user
    const user = await User.findOne({
      email,
      isVerified: false
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found or already verified'
      });
    }

    // Generate new verification token
    const verifyToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // Update user with new token
    user.verifyToken = verifyToken;
    await user.save();

    // Send new verification email
    try {
      const emailResult = await sendVerificationEmail(email, verifyToken);
      console.log('✅ Verification email resent successfully to:', email);

      res.status(200).json({
        success: true,
        message: 'Verification email sent successfully! Please check your inbox.',
        emailSent: true
      });

    } catch (emailError) {
      console.error('❌ Failed to resend verification email:', emailError.message);

      res.status(500).json({
        success: false,
        message: 'Failed to send verification email',
        error: emailError.message
      });
    }

  } catch (error) {
    console.error('❌ Resend verification error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to resend verification email',
      error: error.message
    });
  }
});


>>>>>>> 0011b2f (trying to add into Production ready code to Production Branch)
