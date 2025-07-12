const Joi = require('joi');
const STATUS = require('../constants/status');
const { isValid24HourTime, isValidDateFormat } = require('../utils/dateUtils');

// Custom validation for date format
const customDate = Joi.string().custom((value, helpers) => {
  if (!isValidDateFormat(value)) {
    return helpers.error('string.dateFormat');
  }
  return value;
}, 'Date Format Validation');

// Custom validation for time format
const customTime = Joi.string().custom((value, helpers) => {
  if (!isValid24HourTime(value)) {
    return helpers.error('string.timeFormat');
  }
  return value;
}, 'Time Format Validation');



// Create validation schemas
const schemas = {
  appointment: {
    create: Joi.object({
      name:Joi.string().allow('',null),
      phoneNumber:Joi.string().allow('',null),
      email:Joi.string().allow('',null),
      barberId: Joi.string().required(),
      service: Joi.string().required(),
      date: customDate.required(),
      requestedTime: customTime.required(),
      notes: Joi.string().allow('', null)
    }),
    update: Joi.object({
      appointmentId: Joi.string().required(),
      status: Joi.string().valid('pending_approval', 'approved', 'rejected', 'completed', 'waiting','pending','ongoing').required(),
      notes: Joi.string().allow('', null)
    })
  },
  walkIn: {
    create: Joi.object({
      customerName: Joi.string().required(),
      customerEmail: Joi.string().email().required(),
      customerPhone: Joi.string().allow('', null),
      barberId: Joi.string().required(),
      service: Joi.string().required(),
      date: customDate.required(),
      arrivalTime: customTime.required(),
      notes: Joi.string().allow('', null)
    }),
    update: Joi.object({
      _id:Joi.string().allow('',null),
      walkinId:Joi.string().required(),
      status: Joi.string().valid('waiting', 'approved', 'completed', 'ongoing').required(),
      notes: Joi.string().allow('', null)
    })
  },
  workingHours: {
    create: Joi.object({
      barberId: Joi.string().required(),
      date: customDate.required(),
      startTime: customTime.required(),
      endTime: customTime.required(),
      isAvailable: Joi.boolean()
    }),
    update: Joi.object({
      _id:Joi.string(),
      barberId:Joi.string().required(),
      date: customDate.required(),
      startTime: customTime,
      endTime: customTime,
      isAvailable: Joi.boolean()
    })
  },
  blockedSlot: {
    create: Joi.object({
      barberId: Joi.string().required(),
      date: customDate.required(),
      startTime: customTime.required(),
      endTime: customTime.required(),
      reason: Joi.string().allow('', null)
    }),
    update: Joi.object({
      barberId:Joi.string().required(),
      startTime: customTime,
      endTime: customTime,
      reason: Joi.string().allow('', null)
    })
  },
  availableSlots: {
    search: Joi.object({
      barberId: Joi.string().required(),
      date: customDate.required()
    })
  },
  auth: {
    register: Joi.object({
      name: Joi.string().min(2).max(50).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
      role: Joi.string().valid('admin', 'barber', 'customer'),
      phoneNumber: Joi.string().allow('', null)
    }),
    login: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
      
    })
  }
};

const validateRequest = (schemaName, validationType) => {
  return (req, res, next) => {
    const schema = schemas[schemaName][validationType];
    
    if (!schema) {
      return res.status(500).json({
        success: false,
        error: `Schema '${schemaName}.${validationType}' not found`
      });
    }

    const { error } = schema.validate(req.body);
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        error: errorMessage
      });
    }

    next();
  };
};

module.exports = validateRequest;