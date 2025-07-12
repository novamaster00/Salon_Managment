const express = require('express');
const {
  createBlockedSlot,
  getBlockedSlots,
  getBlockedSlot,
  updateBlockedSlot,
  deleteBlockedSlot,
  createBlockedSlotWithReplacement
} = require('../controllers/blockedSlotController');
const validateRequest = require('../middleware/validator');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/',
  protect,
  authorize('barber', 'admin'),
  validateRequest('blockedSlot', 'create'),
  createBlockedSlot
);

router.get('/', protect, getBlockedSlots);
router.get('/single', protect, getBlockedSlot);

router.put('/:id', protect, authorize('barber', 'admin'), updateBlockedSlot);

router.delete(
  '/',
  protect,
  authorize('barber', 'admin'),
  deleteBlockedSlot
);

router.put('/confirm-replace',protect,authorize('barber','admin'),createBlockedSlotWithReplacement);

module.exports = router;