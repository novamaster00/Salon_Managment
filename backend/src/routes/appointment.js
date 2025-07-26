// appointment router app.use('/api/appointments', appointmentRoutes);
const express = require('express');
const {
  createAppointment,
  getAppointments,
  getAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  confirmSuggestedAppointment,
  approveAppointment,
  rejectAppointment,
  
} = require('../controllers/appointmentController');
<<<<<<< HEAD
const validateRequest = require('../middleware/validator');
=======
const {validateRequest} = require('../middleware/validator');
>>>>>>> 0011b2f (trying to add into Production ready code to Production Branch)
const { protect, authorize } = require('../middleware/auth');
const { checkTimeAvailability } = require('../middleware/timeEnforcement');
const getAvailableSlots = require('../controllers/availableSlotsController');
const { checkSlotAvailability } = require('../services/timeSlotService');

const router = express.Router();

router.post(
  '/',
  protect,
  authorize('customer','barber','admin'),
  validateRequest('appointment', 'create'),
  checkTimeAvailability,
  createAppointment
);

<<<<<<< HEAD
router.post('/available-slots',validateRequest('appointment', 'create'),checkSlotAvailability );
=======
router.post('/available-slots',protect,authorize('customer','barber','admin'),validateRequest('appointment', 'create'),checkSlotAvailability );
>>>>>>> 0011b2f (trying to add into Production ready code to Production Branch)

router.get('/', protect, getAppointments);
router.get('/single', protect, getAppointment);

router.put(
  '/status',
  protect,
  authorize('barber', 'admin'),
  validateRequest('appointment', 'update'),
  updateAppointmentStatus
);

<<<<<<< HEAD
router.put('/confirm', protect, confirmSuggestedAppointment);// once appointment request made user must confimr the booking.  
=======
router.put('/confirm', protect, confirmSuggestedAppointment);
>>>>>>> 0011b2f (trying to add into Production ready code to Production Branch)

router.delete(
  '/',
  protect,authorize('barber','admin'),
  deleteAppointment
);

router.put('/:id/approve', protect, authorize('barber', 'admin'), approveAppointment);
router.put('/:id/reject', protect, authorize('barber', 'admin'), rejectAppointment);


module.exports = router;