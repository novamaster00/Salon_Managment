const express = require('express');
const getAvailableSlots  = require('../controllers/availableSlotsController');
<<<<<<< HEAD
const validateRequest = require('../middleware/validator');
=======
const {validateRequest} = require('../middleware/validator');
>>>>>>> 0011b2f (trying to add into Production ready code to Production Branch)
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/',protect,
  validateRequest('availableSlots', 'search'),
  getAvailableSlots
);

module.exports = router;