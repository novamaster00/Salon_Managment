// walkIn.js router app.use('/api/walkins', walkInRoutes);
const express = require('express');
const {
  createWalkIn,
  getWalkIns,
  getWalkIn,
  updateWalkInStatus
} = require('../controllers/walkInController');
const validateRequest = require('../middleware/validator');
const { protect, authorize } = require('../middleware/auth');
const { enforceWorkingHours } = require('../middleware/timeEnforcement');

const router = express.Router();

// Public route to create walk-in
router.post(
  '/',
  validateRequest('walkIn', 'create'),
  enforceWorkingHours,
  createWalkIn
);

// Protected routes
router.get('/', protect, authorize('barber', 'admin'), getWalkIns);
router.get('/single', protect, authorize('barber', 'admin'), getWalkIn);

router.put(
  '/status',
  protect,
  authorize('barber', 'admin'),
  validateRequest('walkIn', 'update'),
  updateWalkInStatus
);

module.exports = router;