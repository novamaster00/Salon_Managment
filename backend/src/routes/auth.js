const express = require('express');
const {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  handleLogoutUser,
  handleRefreshToken,
<<<<<<< HEAD
} = require('../controllers/authController');
const validateRequest = require('../middleware/validator');
const { protect } = require('../middleware/auth');

const router = express.Router();

=======
  verifyEmail,
  resendVerificationEmail,
  getUserProfile,
  updateUserProfile,
  changePassword
} = require('../controllers/authController');
const {
  forgotPassword,
  resetPassword,
  validateResetToken
} = require('../controllers/authRecoveryController');
const {validateRequest,validateForgotPassword,validateResetPassword } = require('../middleware/validator');
const { protect} = require('../middleware/auth');
const router = express.Router();



>>>>>>> 0011b2f (trying to add into Production ready code to Production Branch)
router.post('/register', validateRequest('auth', 'register'), register);
router.post('/login', validateRequest('auth', 'login'), login);
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);
router.get('/logout',handleLogoutUser);
router.get('/refresh', handleRefreshToken);
<<<<<<< HEAD



module.exports = router;
=======
router.get('/verify-email',verifyEmail);
router.post('/resend-verification', resendVerificationEmail);
router.get('/refresh', handleRefreshToken);
//forgot password
router.post('/forgot-password', validateForgotPassword, forgotPassword);
// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password', validateResetPassword, resetPassword);
// GET /api/auth/validate-reset-token/:token - Validate if reset token is valid (optional)
router.get('/validate-reset-token/:token', validateResetToken);
router.get('/profile/:userId', protect, getUserProfile);
router.put('/profile/:userId', protect, updateUserProfile);  
router.put('/profile/:userId/password', protect, changePassword);


module.exports = router;
>>>>>>> 0011b2f (trying to add into Production ready code to Production Branch)
