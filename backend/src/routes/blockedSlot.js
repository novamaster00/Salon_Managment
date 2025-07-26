const express = require('express');
const {
  createBlockedSlot,
  getBlockedSlots,
  getBlockedSlot,
  updateBlockedSlot,
  deleteBlockedSlot,
  createBlockedSlotWithReplacement
} = require('../controllers/blockedSlotController');
<<<<<<< HEAD
const validateRequest = require('../middleware/validator');
=======
const {validateRequest} = require('../middleware/validator');
>>>>>>> 0011b2f (trying to add into Production ready code to Production Branch)
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