const jwt = require('jsonwebtoken');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');
const asyncHandler = require('./async');

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  // Get token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  

  // Make sure token exists
  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
    
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request
    req.user = await User.findById(decoded.id);

    console.log(req.user);

    // Check if user exists
    if (!req.user) {
      return next(new ErrorResponse('User no longer exists', 401));
    }

    next();
  } catch (err) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
});

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
  
    if (!req.user) {
      return next(new ErrorResponse('User not found', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role ${req.user.role} is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};

// Check if user is barber for specific appointment or walk-in
exports.isBarberForResource = (model) => asyncHandler(async (req, res, next) => {
  if (req.user.role === 'admin') {
    return next(); // Admins can access all resources
  }

  const resourceId = req.params.id || req.body.id;
  if (!resourceId) {
    return next(new ErrorResponse('Resource ID is required', 400));
  }

  const resource = await model.findById(resourceId);
  if (!resource) {
    return next(new ErrorResponse('Resource not found', 404));
  }

  // Check if the logged-in user is the barber for this resource
  if (resource.barberId.toString() !== req.user._id.toString()) {
    return next(new ErrorResponse('Not authorized to access this resource', 403));
  }

  next();
});