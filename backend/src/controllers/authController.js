const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail } = require('../utils/emailSender'); // ADD THIS IMPORT

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, phoneNumber } = req.body;
  console.log('🔄 Registration started for:', email);

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('❌ User already exists:', email);
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Generate verification token
    const verifyToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });
    console.log('🔑 Generated verification token for:', email);

    // Create user with verification token
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'customer',
      phoneNumber,
      isVerified: false,
      verifyToken
    });

    console.log('👤 User created successfully:', user.email, 'ID:', user._id);

    // Send verification email
    try {
      const emailResult = await sendVerificationEmail(email, verifyToken);
      console.log('✅ Verification email sent successfully to:', email);

      // Return success response without auto-login
      res.status(201).json({
        success: true,
        message: 'Registration successful! Please check your email to verify your account before logging in.',
        emailSent: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          phoneNumber: user.phoneNumber
        }
      });

    } catch (emailError) {
      console.error('❌ Failed to send verification email:', emailError.message);
      
      // Delete the user since email failed to send
      await User.findByIdAndDelete(user._id);
      console.log('🗑️ Deleted user due to email failure:', user.email);

      return res.status(500).json({
        success: false,
        message: 'Registration failed: Could not send verification email. Please try again.',
        error: emailError.message
      });
    }

  } catch (error) {
    console.error('❌ Registration error:', error.message);
    console.error('Full registration error:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  console.log('🔍 Login attempt for:', email);

  // Validate email & password
  if (!email || !password) {
    console.log('❌ Missing email or password');
    return res.status(400).json({
      success: false,
      message: 'Please provide an email and password'
    });
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    console.log('❌ User not found:', email);
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  
  // Check if user is verified
  if (!user.isVerified) {
    console.log('❌ User not verified:', email);
    return res.status(401).json({
      success: false,
      message: 'Please verify your email before logging in. Check your inbox for the verification link.',
      needsVerification: true
    });
  }

   // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    console.log('❌ Invalid password for:', email);
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
  
  console.log('✅ Login successful for:', email);
  // Create token
  const token = user.getSignedJwtToken();

  // Prepare user object for response (without password)
  const userResponse = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phoneNumber: user.phoneNumber,
    isVerified: user.isVerified
  };

  // Set cookie options
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(200)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: userResponse
    });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
const updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
    phoneNumber: req.body.phoneNumber
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
const updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Password is incorrect', 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token
    });
};

const handleLogoutUser = async (req, res) => {
  const cookies = req.cookies;

  if (!cookies?.jwt) return res.sendStatus(204);

  const refreshToken = cookies.jwt;

  const foundUser = await User.findOne({ refreshToken: refreshToken }).exec();

  if (!foundUser) {
    res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });
    return res.sendStatus(204);
  }

  foundUser.refreshToken = '';
  const result = await foundUser.save();

  res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });
  return res.sendStatus(204);
};

const handleRefreshToken = async (req, res) => {
  const cookies = req.cookies;

  if (!cookies?.jwt) return res.sendStatus(401);

  const refreshToken = cookies.jwt;

  const foundUser = await User.findOne({ refreshToken: refreshToken }).exec();

  if (!foundUser) return res.sendStatus(403);

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
    if (err || foundUser.email !== decoded.email) return res.sendStatus(403);

    const roles = Object.values(foundUser.roles).filter(Boolean);

    const accessToken = jwt.sign({
      "userInfo": {
        "user_id": foundUser._id,
        "email": foundUser.email,
        "roles": roles
      }
    }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1m" });

    res.json({ accessToken });
  });
};

const verifyEmail = async (req, res) => {
  const { token } = req.query;
  
  console.log('🔍 === EMAIL VERIFICATION DEBUG START ===');
  console.log('📝 Raw token from query:', token);
  console.log('📝 Token type:', typeof token);
  console.log('📝 Token length:', token?.length);
  console.log('📝 Request URL:', req.url);
  console.log('📝 Full query params:', req.query);
  
  if (!token) {
    console.log('❌ No token provided');
    return res.status(400).json({ 
      success: false,
      message: 'Verification token is required' 
    });
  }

  try {
    // Decode URL if needed
    const decodedToken = decodeURIComponent(token);
    console.log('🔍 Decoded token:', decodedToken);
    
    // Verify and decode the JWT token
    console.log('🔍 Attempting to decode token...');
    const decoded = jwt.verify(decodedToken, process.env.JWT_SECRET);
    console.log('✅ Token decoded successfully:', JSON.stringify(decoded, null, 2));
    
    // Check token expiration more explicitly
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      console.log('⏰ Token expired:', new Date(decoded.exp * 1000));
      return res.status(400).json({ 
        success: false,
        message: 'Verification link has expired. Please request a new verification email.',
        expired: true
      });
    }
    
    // Find user by email from token
    console.log('🔍 Looking for user with email:', decoded.email);
    const user = await User.findOne({ 
      email: decoded.email
    });

    if (!user) {
      console.log('❌ User not found in database for email:', decoded.email);
      return res.status(400).json({ 
        success: false,
        message: 'User not found. The verification link may be invalid.' 
      });
    }

    console.log('👤 User found:', {
      id: user._id,
      email: user.email,
      isVerified: user.isVerified,
      hasVerifyToken: !!user.verifyToken
    });

    // Check if user is already verified
    if (user.isVerified) {
      console.log('ℹ️ User already verified:', decoded.email);
      return res.status(200).json({ 
        success: true,
        message: 'Email already verified. You can now login.',
        alreadyVerified: true
      });
    }

    // Update user verification status
    console.log('🔄 Updating user verification status...');
    const updateResult = await User.findByIdAndUpdate(
      user._id,
      {
        isVerified: true,
        verifyToken: undefined,
        verifiedAt: new Date()
      },
      { new: true, runValidators: true }
    );
    
    console.log('✅ User updated successfully:', {
      id: updateResult._id,
      email: updateResult.email,
      isVerified: updateResult.isVerified,
      verifiedAt: updateResult.verifiedAt
    });

    console.log('✅ Email verified successfully for:', decoded.email);
    console.log('🔍 === EMAIL VERIFICATION DEBUG END ===');
    
    res.status(200).json({ 
      success: true,
      message: 'Email verified successfully! You can now login.',
      user: {
        id: updateResult._id,
        email: updateResult.email,
        isVerified: true,
        verifiedAt: updateResult.verifiedAt
      }
    });
    
  } catch (err) {
    console.log('❌ === EMAIL VERIFICATION ERROR ===');
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('Full error:', err);
    
    if (err.name === 'TokenExpiredError') {
      console.log('⏰ Token has expired');
      return res.status(400).json({ 
        success: false,
        message: 'Verification link has expired. Please request a new verification email.',
        expired: true
      });
    }
    
    if (err.name === 'JsonWebTokenError') {
      console.log('🔍 Invalid JWT token');
      return res.status(400).json({ 
        success: false,
        message: 'Invalid verification link. Please check the link or request a new one.' 
      });
    }
    
    console.log('🔍 === EMAIL VERIFICATION ERROR END ===');
    res.status(500).json({ 
      success: false,
      message: 'Verification failed. Please try again or contact support.', 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

const resendVerificationEmail = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  
  console.log('🔄 Resending verification email for:', email);
  
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }
  
  try {
    // Find unverified user
    const user = await User.findOne({ 
      email,
      isVerified: false 
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found or already verified'
      });
    }
    
    // Generate new verification token
    const verifyToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    // Update user with new token
    user.verifyToken = verifyToken;
    await user.save();
    
    // Send new verification email
    try {
      const emailResult = await sendVerificationEmail(email, verifyToken);
      console.log('✅ Verification email resent successfully to:', email);
      
      res.status(200).json({
        success: true,
        message: 'Verification email sent successfully! Please check your inbox.',
        emailSent: true
      });
      
    } catch (emailError) {
      console.error('❌ Failed to resend verification email:', emailError.message);
      
      res.status(500).json({
        success: false,
        message: 'Failed to send verification email',
        error: emailError.message
      });
    }
    
  } catch (error) {
    console.error('❌ Resend verification error:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification email',
      error: error.message
    });
  }
});
// @desc    Get user profile by ID
// @route   GET /api/auth/profile/:userId
// @access  Private
const getUserProfile = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  
  // Users can only access their own profile unless they're admin
  if (req.user.id !== userId && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only view your own profile.'
    });
  }

  const user = await User.findById(userId).select('-password -verifyToken -resetPasswordToken');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
      isVerified: user.isVerified
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile/:userId
// @access  Private
const updateUserProfile = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const { name, email, phoneNumber } = req.body;
  
  // Users can only update their own profile unless they're admin
  if (req.user.id !== userId && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only update your own profile.'
    });
  }

  // Check if email is being changed and if it already exists
  if (email) {
    const existingUser = await User.findOne({ 
      email: email.toLowerCase(),
      _id: { $ne: userId } // Exclude current user from check
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email is already in use by another account'
      });
    }
  }

  const updateData = {};
  if (name) updateData.name = name.trim();
  if (email) updateData.email = email.toLowerCase().trim();
  if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;

  const user = await User.findByIdAndUpdate(
    userId,
    updateData,
    {
      new: true,
      runValidators: true
    }
  ).select('-password -verifyToken -resetPasswordToken');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profileImage: user.profileImage
    }
  });
});

// @desc    Change user password
// @route   PUT /api/auth/profile/:userId/password
// @access  Private
const changePassword = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const { currentPassword, newPassword } = req.body;
  
  // Users can only change their own password unless they're admin
  if (req.user.id !== userId && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only change your own password.'
    });
  }

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Current password and new password are required'
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 6 characters long'
    });
  }

  const user = await User.findById(userId).select('+password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // For admin changing other user's password, skip current password check
  if (req.user.role === 'admin' && req.user.id !== userId) {
    user.password = newPassword;
    await user.save();
  } else {
    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();
  }

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});


// FIXED: Export all functions consistently
module.exports = {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  handleLogoutUser,
  handleRefreshToken,
  verifyEmail,
  resendVerificationEmail,
  changePassword,
  updateUserProfile,
  getUserProfile
};