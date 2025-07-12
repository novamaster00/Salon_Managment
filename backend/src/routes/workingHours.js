const express = require('express');
const {
  createWorkingHours,
  getWorkingHours,
  getWorkingHoursById,
  updateWorkingHours,
  deleteWorkingHours,
  getWorkingHoursByBarberAndDate,
  createWorkingHoursWithReplacement
} = require('../controllers/workingHoursController');
const validateRequest = require('../middleware/validator');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Protected routes for barber and admin
router.post(
  '/',
  protect
  ,authorize('barber', 'admin'),
  validateRequest('workingHours', 'create'),
  createWorkingHours
);

router.get('/',protect,authorize('barber', 'admin'),getWorkingHours);// for admin only 
router.get('/my', protect, authorize('barber', 'admin'),getWorkingHoursById);//for barber and admin 

router.put(
  '/',
  protect,
  authorize('barber', 'admin'),
  validateRequest('workingHours', 'update'),
  updateWorkingHours
);// for barber and admin only 

router.delete(
  '/',
  protect,
  authorize('barber', 'admin'),
  deleteWorkingHours
);//for barber and admin only 

// Public route to get working hours by barber and date
router.post('/barber-date', getWorkingHoursByBarberAndDate);// this is used for poulate barber in drop down may for appointmnet 

router.post('/confirm-replace',protect,authorize('barber', 'admin'),createWorkingHoursWithReplacement);


module.exports = router;