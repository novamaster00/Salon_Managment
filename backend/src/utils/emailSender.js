const nodemailer = require('nodemailer');
const Bull = require('bull');
const { emailConfig } = require('../config/serviceConfig');

// Create a Bull queue for email processing
const emailQueue = new Bull('email-queue', {
  redis: process.env.REDIS_URL || {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379
  },
  limiter: emailConfig.throttle.enabled ? {
    max: emailConfig.throttle.limit,
    duration: emailConfig.throttle.interval
  } : undefined
});

// Fallback to direct sending if Redis is not available
let useQueue = true;

// Configure nodemailer transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Initialize the transporter
(async () => {
  try {
    await transporter.verify();
    console.log('Email server connection established');
    
    // Test Bull queue connection
    await emailQueue.isReady();
    console.log('Email queue ready');
  } catch (error) {
    console.error('Email configuration error:', error);
    if (error.message.includes('redis')) {
      console.log('Falling back to direct email sending');
      useQueue = false;
    }
  }
})();

// Process emails from the queue
emailQueue.process(async (job) => {
  const { to, subject, html, text } = job.data;
  
  const mailOptions = {
    from: emailConfig.from,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>?/gm, '')
  };
  
  return transporter.sendMail(mailOptions);
});

// Log completed jobs
emailQueue.on('completed', (job, result) => {
  console.log(`Email job ${job.id} completed. MessageId: ${result.messageId}`);
});

// Log failed jobs
emailQueue.on('failed', (job, error) => {
  console.error(`Email job ${job.id} failed:`, error);
});

/**
 * Send an email
 * 
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML content
 * @param {string} [options.text] - Plain text alternative
 * @returns {Promise} - Resolves when email is sent or queued
 */
const sendEmail = async ({ to, subject, html, text }) => {
  if (!to || !subject || !html) {
    throw new Error('Missing required email parameters');
  }
  
  // Add to queue if available, otherwise send directly
  if (useQueue) {
    return emailQueue.add({ to, subject, html, text });
  } else {
    const mailOptions = {
      from: emailConfig.from,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>?/gm, '')
    };
    
    return transporter.sendMail(mailOptions);
  }
};

module.exports = { 
  sendEmail,
  emailQueue
};