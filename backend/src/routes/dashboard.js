const express = require('express');
const {
  getDashboardData,
  getAdminDashboard
} = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/',
  protect,
  authorize('barber', 'admin'),
  getDashboardData
);

router.post(
  '/admin',
  protect,
  authorize('admin'),
  getAdminDashboard
);

module.exports = router;