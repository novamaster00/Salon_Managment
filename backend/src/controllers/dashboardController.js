const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Appointment = require('../models/Appointment');
const WaitingQueue = require('../models/WaitingQueue');
const WalkIn = require('../models/WalkIn');
const WorkingHours = require('../models/WorkingHours');
const STATUS = require('../constants/status');

// @desc    Get barber dashboard data
// @route   GET /api/dashboard
// @access  Private (Barber/Admin)
exports.getDashboardData = asyncHandler(async (req, res, next) => {
  const { barberId,date} = req.body;

  console.log('Decoded User from JWT:', req.user);

  // Inside any route handler or middleware
  console.log('Authorization Header:', req.headers.authorization);

  // Use logged-in barber's ID if not specified and user is a barber
  const targetBarberId = barberId || (req.user.role === 'barber' ? req.user.id : null);
  
  // If no barberId is specified and user is not a barber
  if (!targetBarberId) {
    return next(new ErrorResponse('Please provide a barber ID', 400));
  }
  
  // If barber is trying to access another barber's dashboard
  if (req.user.role === 'barber' && req.user.id !== targetBarberId) {
    return next(new ErrorResponse('Not authorized to access this dashboard', 403));
  }
  
  // Default to today if no date specified
  const targetDate = date || new Date().toISOString().split('T')[0];
  
  // Get working hours
  const workingHours = await WorkingHours.findOne({
    barberId: targetBarberId,
    date: targetDate
  }); 
  
  // Get pending appointments
  const pendingAppointments = await Appointment.find({
    barberId: targetBarberId,
    status: STATUS.PENDING_APPROVAL
  }).populate({
    path: 'customerId',
    select: 'name email phoneNumber'
  }).sort('date requestedTime');
  
  // Get approved appointments for the day
  const approvedAppointments = await Appointment.find({
    barberId: targetBarberId,
    date: targetDate,
    status: STATUS.APPROVED
  }).populate({
    path: 'customerId',
    select: 'name email phoneNumber'
  }).sort('startTime');
  
  // Get walk-ins for the day
  const walkIns = await WalkIn.find({
    barberId: targetBarberId,
    date: targetDate
  }).sort('arrivalTime');
  
  // Get waiting queue
  const waitingQueue = await WaitingQueue.find({
    barberId: targetBarberId,
    date: targetDate,
    status: STATUS.WAITING
  }).sort('position');
  
  // Populate the queue with source details
  const populatedQueue = await Promise.all(
    waitingQueue.map(async (entry) => {
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
  
  // Get current service (ongoing)
  const currentService = await WaitingQueue.findOne({
    barberId: targetBarberId,
    date: targetDate,
    status: STATUS.ONGOING
  });
  
  let currentServiceData = null;
  if (currentService) {
    if (currentService.sourceType === 'appointment') {
      currentServiceData = await Appointment.findById(currentService.sourceId)
        .populate({
          path: 'customerId',
          select: 'name email phoneNumber'
        });
    } else {
      currentServiceData = await WalkIn.findById(currentService.sourceId);
    }
  }
  
  // Get completed services for the day
  const completedServices = await WaitingQueue.find({
    barberId: targetBarberId,
    date: targetDate,
    status: STATUS.COMPLETED
  }).sort('updatedAt');
  
  const populatedCompletedServices = await Promise.all(
    completedServices.map(async (entry) => {
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
  
  // Calculate metrics
  const metrics = {
    totalAppointments: approvedAppointments.length,
    totalWalkIns: walkIns.length,
    pendingApprovals: pendingAppointments.length,
    inQueue: populatedQueue.length,
    completed: populatedCompletedServices.length
  };

  console.log(metrics);
  
  res.status(200).json({
    success: true,
    data: {
      date: targetDate,
      workingHours: workingHours || null,
      metrics,
      pendingAppointments,
      currentService: currentServiceData ? {
        ...currentService.toObject(),
        sourceData: currentServiceData
      } : null,
      waitingQueue: populatedQueue,
      completedServices: populatedCompletedServices
    }
  });
});

// @desc    Get admin overview dashboard data
// @route   GET /api/dashboard/admin
// @access  Private (Admin only)
exports.getAdminDashboard = asyncHandler(async (req, res, next) => {
  const { date } = req.body;
  
  // Default to today if no date specified
  const targetDate = date || new Date().toISOString().split('T')[0];
  
  // Get all appointments for the day
  const appointments = await Appointment.find({
    date: targetDate
  }).populate([
    {
      path: 'customerId',
      select: 'name email'
    },
    {
      path: 'barberId',
      select: 'name'
    }
  ]);
  
  // Get all walk-ins for the day
  const walkIns = await WalkIn.find({
    date: targetDate
  }).populate({
    path: 'barberId',
    select: 'name'
  });
  
  // Get all waiting queue entries for the day
  const waitingQueue = await WaitingQueue.find({
    date: targetDate,
    status: { $in: [STATUS.WAITING, STATUS.ONGOING] }
  }).populate({
    path: 'barberId',
    select: 'name'
  }).sort('position');
  
  // Calculate metrics by status
  const appointmentsByStatus = {
    [STATUS.PENDING_APPROVAL]: appointments.filter(a => a.status === STATUS.PENDING_APPROVAL).length,
    [STATUS.APPROVED]: appointments.filter(a => a.status === STATUS.APPROVED).length,
    [STATUS.REJECTED]: appointments.filter(a => a.status === STATUS.REJECTED).length,
    [STATUS.ONGOING]: appointments.filter(a => a.status === STATUS.ONGOING).length,
    [STATUS.COMPLETED]: appointments.filter(a => a.status === STATUS.COMPLETED).length
  };
  
  const walkInsByStatus = {
    [STATUS.WAITING]: walkIns.filter(w => w.status === STATUS.WAITING).length,
    [STATUS.ONGOING]: walkIns.filter(w => w.status === STATUS.ONGOING).length,
    [STATUS.COMPLETED]: walkIns.filter(w => w.status === STATUS.COMPLETED).length
  };
  
  // Calculate additional stats
  const metrics = {
    totalAppointments: appointments.length,
    totalWalkIns: walkIns.length,
    appointmentsByStatus,
    walkInsByStatus,
    inQueue: waitingQueue.length
  };
  
  res.status(200).json({
    success: true,
    data: {
      date: targetDate,
      metrics,
      appointments,
      walkIns,
      waitingQueue
    }
  });
});