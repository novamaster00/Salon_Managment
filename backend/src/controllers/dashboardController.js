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
  const { barberId, date } = req.body;

  console.log('=== DASHBOARD DEBUG START ===');
  console.log('Request body:', req.body);
  console.log('Decoded User from JWT:', req.user);
  console.log('Authorization Header:', req.headers.authorization);

  // Use logged-in barber's ID if not specified and user is a barber
  const targetBarberId = barberId || (req.user.role === 'barber' ? req.user.id : null);
  
  // If no barberId is specified and user is not a barber
  if (!targetBarberId) {
    return next(new ErrorResponse('Please provide a barber ID', 400));
  }
  
  console.log('Target Barber ID:', targetBarberId);
  console.log('Target Barber ID Type:', typeof targetBarberId);
  
  // If barber is trying to access another barber's dashboard
  if (req.user.role === 'barber' && req.user.id !== targetBarberId) {
    return next(new ErrorResponse('Not authorized to access this dashboard', 403));
  }
  
  // Default to today if no date specified
  const targetDate = date || new Date().toISOString().split('T')[0];
  console.log('Target Date:', targetDate);
  console.log('Target Date Type:', typeof targetDate);
  
  // DEBUG: Check what's in the database
  console.log('=== DATABASE CONTENT CHECK ===');
  
  // Check all appointments for this barber (regardless of date/status)
  const allBarberAppointments = await Appointment.find({ barberId: targetBarberId });
  console.log(`Total appointments for barber ${targetBarberId}:`, allBarberAppointments.length);
  console.log('Sample appointment:', allBarberAppointments[0]);
  
  // Check all walk-ins for this barber
  const allBarberWalkIns = await WalkIn.find({ barberId: targetBarberId });
  console.log(`Total walk-ins for barber ${targetBarberId}:`, allBarberWalkIns.length);
  console.log('Sample walk-in:', allBarberWalkIns[0]);
  
  // Check what dates exist in appointments
  const appointmentDates = await Appointment.distinct('date', { barberId: targetBarberId });
  console.log('Available appointment dates:', appointmentDates);
  
  // Check what dates exist in walk-ins
  const walkInDates = await WalkIn.distinct('date', { barberId: targetBarberId });
  console.log('Available walk-in dates:', walkInDates);
  
  // Check pending appointments with different query variations
  console.log('=== PENDING APPOINTMENTS DEBUG ===');
  
  // Check what STATUS values are available
  console.log('STATUS constants:', STATUS);
  
  // Check all appointments regardless of status
  const allAppointments = await Appointment.find({ barberId: targetBarberId });
  console.log('All appointments for barber:', allAppointments.map(apt => ({
    id: apt._id,
    status: apt.status,
    date: apt.date,
    dateType: typeof apt.date
  })));
  
  // Check all waiting queue entries
  const allWaitingQueue = await WaitingQueue.find({ barberId: targetBarberId });
  console.log('All waiting queue entries:', allWaitingQueue.map(wq => ({
    id: wq._id,
    status: wq.status,
    date: wq.date,
    dateType: typeof wq.date,
    position: wq.position
  })));
  
  // Check all walk-ins
  const allWalkIns = await WalkIn.find({ barberId: targetBarberId });
  console.log('All walk-ins:', allWalkIns.map(wi => ({
    id: wi._id,
    status: wi.status,
    date: wi.date,
    dateType: typeof wi.date
  })));

  console.log('=== ORIGINAL QUERIES DEBUG ===');
  
  // Get working hours
  const workingHours = await WorkingHours.findOne({
    barberId: targetBarberId,
    date: targetDate
  }); 
  console.log('Working hours found:', !!workingHours);
  
  // Get pending appointments
  const pendingAppointments = await Appointment.find({
    barberId: targetBarberId,
    status: STATUS.PENDING_APPROVAL
  }).populate({
    path: 'customerId',
    select: 'name email phoneNumber'
  }).sort('date requestedTime');
  console.log('Pending appointments query result:', pendingAppointments.length);
  
  // Get approved appointments for the day
  const approvedAppointments = await Appointment.find({
    barberId: targetBarberId,
    date: targetDate,
    status: STATUS.APPROVED
  }).populate({
    path: 'customerId',
    select: 'name email phoneNumber'
  }).sort('startTime');
  console.log('Approved appointments query result:', approvedAppointments.length);
  console.log('Approved appointments query conditions:', {
    barberId: targetBarberId,
    date: targetDate,
    status: STATUS.APPROVED
  });
  
  // Get walk-ins for the day
  const walkIns = await WalkIn.find({
    barberId: targetBarberId,
    date: targetDate
  }).sort('arrivalTime');
  console.log('Walk-ins query result:', walkIns.length);
  console.log('Walk-ins query conditions:', {
    barberId: targetBarberId,
    date: targetDate
  });
  
  // Get waiting queue
  const waitingQueue = await WaitingQueue.find({
    barberId: targetBarberId,
    date: targetDate,
    status: STATUS.WAITING
  }).sort('position');
  console.log('Waiting queue query result:', waitingQueue.length);
  console.log('Waiting queue query conditions:', {
    barberId: targetBarberId,
    date: targetDate,
    status: STATUS.WAITING
  });
  
  // Let's also try querying without the date filter to see if date is the issue
  const waitingQueueNoDate = await WaitingQueue.find({
    barberId: targetBarberId,
    status: STATUS.WAITING
  });
  console.log('Waiting queue WITHOUT date filter:', waitingQueueNoDate.length);
  
  // Check if your "waiting" entry matches the exact query
  const exactMatch = await WaitingQueue.findOne({
    barberId: targetBarberId,
    date: targetDate,
    status: STATUS.WAITING
  });
  console.log('Exact match for waiting queue:', !!exactMatch);
  if (exactMatch) {
    console.log('Exact match details:', {
      id: exactMatch._id,
      barberId: exactMatch.barberId,
      date: exactMatch.date,
      status: exactMatch.status,
      position: exactMatch.position
    });
  }
  
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
  console.log('Current service found:', !!currentService);
  
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
  console.log('Completed services query result:', completedServices.length);
  
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

  console.log('Final metrics:', metrics);
  console.log('=== DASHBOARD DEBUG END ===');
  
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
      completedServices: populatedCompletedServices,
      WalkIn: WalkIn 
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