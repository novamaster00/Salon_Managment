const express = require('express');
const {
  getWaitingQueue,
  startNextCustomer,
  completeCurrentService,
  getCompletedServices
} = require('../controllers/waitingQueueController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', getWaitingQueue);

router.put(
  '/next',
  protect,
  authorize('barber'),
  startNextCustomer
);

router.put(
  '/complete',
  protect,
  authorize('barber'),
  completeCurrentService
);

router.post(
  '/completed',
  protect,
  authorize('barber', 'admin'),
  getCompletedServices
);

module.exports = router;