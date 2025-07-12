const express = require('express');
const {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  handleLogoutUser,
  handleRefreshToken,
} = require('../controllers/authController');
const validateRequest = require('../middleware/validator');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', validateRequest('auth', 'register'), register);
router.post('/login', validateRequest('auth', 'login'), login);
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);
router.get('/logout',handleLogoutUser);
router.get('/refresh', handleRefreshToken);



module.exports = router;