const express = require('express');
const getAvailableSlots  = require('../controllers/availableSlotsController');
const validateRequest = require('../middleware/validator');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/',protect,
  validateRequest('availableSlots', 'search'),
  getAvailableSlots
);

module.exports = router;