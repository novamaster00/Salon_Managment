const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const mongoose = require('mongoose');

// Test token decoder - use this to manually test
//  tokens
const testTokenDecoder = async (tokenToTest) => {
  console.log('🧪 === TOKEN TEST START ===');
  console.log('📝 Testing token:', tokenToTest);
  
  try {
    const decoded = jwt.verify(tokenToTest, process.env.JWT_SECRET);
    console.log('✅ Token is valid:', decoded);
    
    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    const isExpired = decoded.exp < now;
    console.log('⏰ Token expired?', isExpired);
    if (isExpired) {
      console.log('📅 Token expired at:', new Date(decoded.exp * 1000));
      console.log('📅 Current time:', new Date());
    }
    
    return { valid: true, decoded, expired: isExpired };
  } catch (error) {
    console.log('❌ Token is invalid:', error.message);
    return { valid: false, error: error.message };
  } finally {
    console.log('🧪 === TOKEN TEST END ===');
  }
};

// Improved registration with better token handling
const registerWithBetterTokens = async (req, res) => {
  const { name, email, password, role, phoneNumber } = req.body;
  console.log('🔄 Registration started for:', email);

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') } // Case insensitive
    });
    
    if (existingUser) {
      console.log('❌ User already exists:', email);
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Generate verification token with user info
    const tokenPayload = {
      email: email.toLowerCase(), // Always lowercase
      timestamp: Date.now() // Add timestamp for uniqueness
    };
    
    const verifyToken = jwt.sign(
      tokenPayload, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );
    
    console.log('🔑 Generated verification token payload:', tokenPayload);

    // Create user with normalized email
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(), // Always store lowercase
      password,
      role: role || 'customer',
      phoneNumber,
      isVerified: false,
      verifyToken // Store the token for comparison if needed
    });

    console.log('👤 User created successfully:', {
      id: user._id,
      email: user.email,
      verifyToken: user.verifyToken
    });

    // Send verification email
    try {
      const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verifyToken}`;
      console.log('🔗 Verification URL:', verificationUrl);
      
      await sendVerificationEmail(user.email, verifyToken);
      console.log('✅ Verification email sent successfully to:', user.email);

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
        },
        // Include verification URL in development mode for testing
        ...(process.env.NODE_ENV === 'development' && { verificationUrl })
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
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

// Manual verification fix - use this to manually verify a user if needed
const manualVerifyUser = async (email) => {
  console.log('🔧 Manual verification for:', email);
  
  try {
    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    });
    
    if (!user) {
      console.log('❌ User not found:', email);
      return { success: false, message: 'User not found' };
    }
    
    user.isVerified = true;
    user.verifyToken = undefined;
    user.verifiedAt = new Date();
    await user.save();
    
    console.log('✅ User manually verified:', email);
    return { success: true, message: 'User verified successfully' };
    
  } catch (error) {
    console.error('❌ Manual verification error:', error);
    return { success: false, error: error.message };
  }
};




// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/Salon_Management', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function debugToken() {
  try {
    const plainToken = '80fcd8821cb25acf892856965934cd9d615e18ea3254c32f73646300b54effdd';
    
    console.log('🔍 Plain token from URL:', plainToken);
    
    // Hash the token the same way as in forgot password
    const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex');
    console.log('🔐 Hashed token for lookup:', hashedToken);
    
    // Check if user exists with this hashed token
    const user = await User.findOne({
      resetPasswordToken: hashedToken
    });
    
    if (user) {
      console.log('✅ User found with token!');
      console.log('📧 Email:', user.email);
      console.log('⏰ Token expires at:', new Date(user.resetPasswordExpires));
      console.log('🕐 Current time:', new Date());
      console.log('⏳ Token expired?', user.resetPasswordExpires < Date.now() ? 'Yes' : 'No');
      
      // Check with time validation
      const validUser = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() }
      });
      
      console.log('✅ Token valid (not expired)?', validUser ? 'Yes' : 'No');
      
    } else {
      console.log('❌ No user found with this token');
      
      // Let's check if there are any users with reset tokens
      const usersWithTokens = await User.find({
        resetPasswordToken: { $exists: true, $ne: null }
      });
      
      console.log('🔍 Users with reset tokens:', usersWithTokens.length);
      
      if (usersWithTokens.length > 0) {
        console.log('🔐 Stored tokens in database:');
        usersWithTokens.forEach((user, index) => {
          console.log(`${index + 1}. ${user.email}: ${user.resetPasswordToken}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugToken();

module.exports = {
  testTokenDecoder,
  registerWithBetterTokens,
  manualVerifyUser
};