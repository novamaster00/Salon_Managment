const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/User');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, phoneNumber } = req.body;

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role: role || 'customer',
    phoneNumber
  });

  sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Create token
  const token = user.getSignedJwtToken();

  // Prepare user object for response (without password)
  const userResponse = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
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
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
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
exports.updatePassword = asyncHandler(async (req, res, next) => {
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
    const cookies = req.cookies

    if (!cookies?.jwt) return res.sendStatus(204)

    const refreshToken = cookies.jwt

    const foundUser = await User.findOne({ refreshToken: refreshToken }).exec()

    if (!foundUser) {
        res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true })
        return res.sendStatus(204)
    }

    foundUser.refreshToken = ''
    const result = await foundUser.save()

    res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true })
    return res.sendStatus(204)
}


const handleRefreshToken = async (req, res) => {
    const cookies = req.cookies

    if (!cookies?.jwt) return res.sendStatus(401)

    const refreshToken = cookies.jwt

    const foundUser = await User.findOne({ refreshToken: refreshToken }).exec()

    if (!foundUser) return res.sendStatus(403)

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
        if (err || foundUser.email !== decoded.email) return res.sendStatus(403)

        const roles = Object.values(foundUser.roles).filter(Boolean)

        const accessToken = jwt.sign({
            "userInfo": {
                "user_id": foundUser._id,
                "email": foundUser.email,
                "roles": roles
            }
        }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1m" })

        res.json({ accessToken })
    })
}

module.exports = {
  register: exports.register,
  login: exports.login,
  getMe: exports.getMe,
  updateDetails: exports.updateDetails,
  updatePassword: exports.updatePassword,
  handleLogoutUser,
  handleRefreshToken
};
