// this is authRecoveryController.js 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User'); 
const { sendPasswordResetEmail, sendPasswordResetConfirmation } = require('../utils/emailSender');

// Forgot Password Controller
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log('🔄 Processing forgot password for:', email);
    
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({
        success: true,
        message: 'If that email exists, you will receive a password reset link shortly.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token before saving to database (for security)
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    console.log('🔑 Generated plain token:', resetToken);
    console.log('🔐 Hashed token for storage:', hashedToken);
    
    // Set HASHED token and expiration (10 minutes)
    user.resetPasswordToken = hashedToken; // Store hashed version
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    await user.save();
    
    console.log('✅ Reset token saved for user:', user.email);
    console.log('⏰ Token expires at:', new Date(user.resetPasswordExpires));

    // Send just the PLAIN token to email service (not the full URL)
    console.log('🔑 Sending plain token to email service:', resetToken);
    await sendPasswordResetEmail(user.email, resetToken, user.name);

    res.json({
      success: true,
      message: 'If that email exists, you will receive a password reset link shortly.',
      // Only include token in development for testing
      ...(process.env.NODE_ENV === 'development' && { 
        token: resetToken, // For easy testing
        expires: new Date(user.resetPasswordExpires).toISOString()
      })
    });

  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset request'
    });
  }
}

// Reset Password Controller
const resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;
    
    console.log('🔄 Processing password reset for token:', token);

    // Validate input
    if (!token || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token, password, and confirm password are required'
      });
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Hash the incoming token to match database storage
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    console.log('🔍 Looking for hashed token:', hashedToken);
    
    // Find user with valid reset token that hasn't expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() } // Check expiration
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    console.log('✅ Valid token found for user:', user.email);

    // Update password (will be hashed by pre-save middleware)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();

    console.log('✅ Password reset successful for user:', user.email);

    // Send confirmation email
    try {
      await sendPasswordResetConfirmation(user.email, user.name);
    } catch (emailError) {
      console.error('⚠️ Failed to send confirmation email:', emailError.message);
      // Don't fail the password reset if email fails
    }

    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });

  } catch (error) {
    console.error('❌ Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset'
    });
  }
};

// Validate Reset Token Controller
const validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    console.log('🔍 Validating token:', token);
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is required'
      });
    }

    // Hash the incoming token to match database storage
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    console.log('🔍 Looking for hashed token:', hashedToken);
    
    // Find user with valid reset token that hasn't expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() } // Check expiration
    });

    console.log('🔍 User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Calculate remaining time
    const remainingTime = Math.max(0, user.resetPasswordExpires - Date.now());
    const remainingMinutes = Math.floor(remainingTime / (1000 * 60));

    res.json({
      success: true,
      message: 'Token is valid',
      email: user.email,
      remainingMinutes: remainingMinutes
    });

  } catch (error) {
    console.error('❌ Token validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during token validation'
    });
  }
};

module.exports = {
  forgotPassword,
  resetPassword,
  validateResetToken
};