// config/emailConfig.js
module.exports = {
  // Email configuration
  emailConfig: {
    // Default sender email
    from: `"Salon App" <${process.env.EMAIL_USER}>`,
    
    // Rate limiting/throttling configuration
    throttle: {
      enabled: true,
      limit: 100, // Maximum emails per interval
      interval: 60 * 1000 // 1 minute in milliseconds
    },
    
    // SMTP configuration (if you want to override nodemailer defaults)
    smtp: {
      service: 'gmail',
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    },
    
    // Email templates configuration
    templates: {
      verification: {
        subject: 'Verify your email',
        from: `"Salon App" <${process.env.EMAIL_USER}>`
      },
      appointment: {
        subject: 'Appointment Confirmation',
        from: `"Salon App" <${process.env.EMAIL_USER}>`
      },
      reminder: {
        subject: 'Appointment Reminder',
        from: `"Salon App" <${process.env.EMAIL_USER}>`
      }
    },
    
    // Queue configuration
    queue: {
      name: 'email-queue',
      redis: {
        url: process.env.REDIS_URL,
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: process.env.REDIS_PORT || 6379
      },
      // Job options
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        },
        removeOnComplete: 10,
        removeOnFail: 5
      }
    }
  }
};