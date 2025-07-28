// Fixed emailSender.js with proper Gmail configuration
const nodemailer = require('nodemailer');
const Bull = require('bull');
const { emailConfig } = require('../config/emailConfig');

console.log('🔍 Environment Check:');
console.log('CLIENT_URL:', process.env.CLIENT_URL);
console.log('REDIS_URL:', process.env.REDIS_URL);
console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'NOT SET');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'NOT SET');

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

let redisConnected = false;

const testRedisConnection = async () => {
  try {
    console.log("REDIS_URL:", process.env.REDIS_URL || "❌ Not Set");
    const testQueue = new Bull('test-connection', {
      redis: process.env.REDIS_URL || {
        host: emailConfig.queue.redis.host,
        port: emailConfig.queue.redis.port
      }
    });
    
    await testQueue.add('test', { test: true });
    console.log('✅ Redis connection successful - using queue');
    redisConnected = true;
    await testQueue.close();
  } catch (error) {
    console.log('❌ Redis connection failed:', error.message);
    console.log('📧 Will send emails directly without queue');
    redisConnected = false;
  }
};

testRedisConnection();

const emailQueue = new Bull(emailConfig.queue.name, {
  redis: process.env.REDIS_URL || {
    host: emailConfig.queue.redis.host,
    port: emailConfig.queue.redis.port
  },
  limiter: emailConfig.throttle.enabled ? {
    max: emailConfig.throttle.limit,
    duration: emailConfig.throttle.interval
  } : undefined,
  defaultJobOptions: emailConfig.queue.defaultJobOptions
});

let useQueue = true;

// Fixed transporter configuration for Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify SMTP connection on startup
(async () => {
  try {
    console.log('🔍 Verifying SMTP connection...');
    
    // Validate email format first
    if (!isValidEmail(process.env.EMAIL_USER)) {
      throw new Error(`Invalid EMAIL_USER format: ${process.env.EMAIL_USER}`);
    }
    
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');
  } catch (error) {
    
    
    if (error.code === 'EAUTH') {
      console.error('📧 Authentication failed - check your EMAIL_USER and EMAIL_PASS');
      console.error('💡 Make sure you\'re using an App Password, not your regular Gmail password');
    } else if (error.code === 'ENOTFOUND') {
      console.error('🌐 SMTP server not found - check your internet connection');
    } else if (error.code === 'ECONNECTION') {
      console.error('🔌 Connection failed - check your network settings');
    } else if (error.message.includes('Invalid EMAIL_USER format')) {
      console.error('📧 Email format error - ensure EMAIL_USER is a valid email address');
    }
    console.error('❌ Email configuration failed:', error.message);
    useQueue = false;
  }
})();

// Enhanced email template (keeping your existing beautiful design)
const getEmailTemplate = (content, title = "DK-HairSalon") => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Inter', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 20px;
            }
            
            .email-container {
                max-width: 600px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            }
            
            .email-header {
                background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
                padding: 40px 30px;
                text-align: center;
                position: relative;
                overflow: hidden;
            }
            
            .email-header::before {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="%23ffffff" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="%23ffffff" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="%23ffffff" opacity="0.1"/><circle cx="10" cy="50" r="0.5" fill="%23ffffff" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
                animation: float 20s ease-in-out infinite;
            }
            
            @keyframes float {
                0%, 100% { transform: translateX(0) translateY(0); }
                25% { transform: translateX(-20px) translateY(-10px); }
                50% { transform: translateX(0) translateY(-20px); }
                75% { transform: translateX(20px) translateY(-10px); }
            }
            
            .logo {
                position: relative;
                z-index: 2;
            }
            
            .logo h1 {
                color: #ffffff;
                font-size: 32px;
                font-weight: 700;
                margin-bottom: 5px;
                letter-spacing: -1px;
            }
            
            .logo span {
                color: #f1c40f;
                font-weight: 300;
            }
            
            .tagline {
                color: rgba(255,255,255,0.8);
                font-size: 14px;
                font-weight: 400;
                position: relative;
                z-index: 2;
            }
            
            .email-body {
                padding: 50px 40px;
                background: #ffffff;
            }
            
            .content-section {
                margin-bottom: 30px;
            }
            
            .content-section h2 {
                color: #2c3e50;
                font-size: 28px;
                font-weight: 600;
                margin-bottom: 20px;
                text-align: center;
            }
            
            .content-section p {
                color: #5a6c7d;
                font-size: 16px;
                line-height: 1.8;
                margin-bottom: 20px;
                text-align: center;
            }
            
            .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #f1c40f 0%, #f39c12 100%);
                color: #2c3e50 !important;
                padding: 16px 40px;
                text-decoration: none;
                border-radius: 50px;
                font-weight: 600;
                font-size: 16px;
                text-align: center;
                transition: all 0.3s ease;
                margin: 20px auto;
                display: block;
                width: fit-content;
                box-shadow: 0 10px 20px rgba(241, 196, 15, 0.3);
            }
            
            .cta-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 15px 30px rgba(241, 196, 15, 0.4);
            }
            
            .info-card {
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                border-radius: 15px;
                padding: 25px;
                margin: 25px 0;
                border-left: 5px solid #f1c40f;
            }
            
            .appointment-details {
                background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
                border-radius: 15px;
                padding: 25px;
                margin: 25px 0;
                border-left: 5px solid #f39c12;
            }
            
            .appointment-details p {
                color: #2c3e50;
                margin-bottom: 10px;
                font-weight: 500;
            }
            
            .appointment-details strong {
                color: #e67e22;
            }
            
            .email-footer {
                background: linear-gradient(135deg, #34495e 0%, #2c3e50 100%);
                padding: 30px;
                text-align: center;
                color: rgba(255,255,255,0.8);
            }
            
            .email-footer p {
                font-size: 14px;
                margin-bottom: 15px;
            }
            
            .social-links {
                margin-top: 20px;
            }
            
            .social-links a {
                display: inline-block;
                width: 40px;
                height: 40px;
                background: rgba(255,255,255,0.1);
                border-radius: 50%;
                margin: 0 10px;
                line-height: 40px;
                text-decoration: none;
                color: #ffffff;
                transition: all 0.3s ease;
            }
            
            .social-links a:hover {
                background: #f1c40f;
                color: #2c3e50;
                transform: translateY(-2px);
            }
            
            .verification-link {
                background: #f8f9fa;
                border: 2px dashed #dee2e6;
                border-radius: 10px;
                padding: 15px;
                margin: 20px 0;
                word-break: break-all;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                color: #6c757d;
            }
            
            @media (max-width: 600px) {
                .email-container {
                    margin: 10px;
                    border-radius: 15px;
                }
                
                .email-header {
                    padding: 30px 20px;
                }
                
                .logo h1 {
                    font-size: 24px;
                }
                
                .email-body {
                    padding: 30px 20px;
                }
                
                .content-section h2 {
                    font-size: 24px;
                }
                
                .cta-button {
                    padding: 14px 30px;
                    font-size: 14px;
                }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="email-header">
                <div class="logo">
                    <h1>DK-<span>HairSalon</span></h1>
                    <div class="tagline">⚡ Powered by Harsh Parmar</div>
                </div>
            </div>
            
            <div class="email-body">
                ${content}
            </div>
            
            <div class="email-footer">
                <p>Thank you for choosing DK-HairSalon</p>
                <p>Classic Grooming • Modern Experience</p>
                <div class="social-links">
                    <a href="#" title="Instagram">📷</a>
                    <a href="#" title="Facebook">📘</a>
                    <a href="#" title="Twitter">🐦</a>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Fixed sendVerificationEmail function
const sendVerificationEmail = async (email, token) => {
  console.log(`📧 Attempting to send verification email to: ${email}`);
  console.log(`🔗 Token: ${token}`);

  // Validate recipient email
  if (!isValidEmail(email)) {
    throw new Error(`Invalid recipient email format: ${email}`);
  }

  const verificationURL = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  console.log(`🌐 Verification URL: ${verificationURL}`);

  const emailContent = `
    <div class="content-section">
        <h2>✨ Welcome to DK-HairSalon!</h2>
        <p>We're excited to have you join our community of style enthusiasts. To complete your registration and unlock the full DK-HairSalon experience, please verify your email address.</p>
        
        <a href="${verificationURL}" class="cta-button">
            ✅ Verify My Email
        </a>
        
        <div class="info-card">
            <p><strong>What happens next?</strong></p>
            <p>• Access to online booking system</p>
            <p>• Exclusive appointment slots</p>
            <p>• Personalized service recommendations</p>
            <p>• Special offers and promotions</p>
        </div>
        
        <p style="color: #7f8c8d; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:
        </p>
        <div class="verification-link">
            ${verificationURL}
        </div>
        
        <p style="color: #95a5a6; font-size: 13px; margin-top: 30px;">
            If you didn't create an account with us, please ignore this email. This link will expire in 24 hours for security reasons.
        </p>
    </div>
  `;

  // Fixed mailOptions - using simple string format for 'from'
  const mailOptions = {
    from: process.env.EMAIL_USER, // Simple format - just the email address
    to: email,
    subject: '✨ Welcome to DK-HairSalon - Verify Your Email',
    html: getEmailTemplate(emailContent, "Email Verification - DK-HairSalon")
  };

  try {
    console.log('📤 Sending verification email directly...');
    console.log('📧 From:', process.env.EMAIL_USER);
    console.log('📧 To:', email);
    
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('❌ Failed to send verification email:', error.message);
    console.error('🔍 Error details:', {
      code: error.code,
      response: error.response,
      command: error.command
    });
    throw error;
  }
};

// Queue processing
if (useQueue) {
  emailQueue.on('waiting', (jobId) => {
    console.log(`📋 Job ${jobId} is waiting`);
  });

  emailQueue.on('active', (job, jobPromise) => {
    console.log(`🔄 Job ${job.id} started processing`);
  });

  emailQueue.on('progress', (job, progress) => {
    console.log(`📊 Job ${job.id} progress: ${progress}%`);
  });

  emailQueue.on('completed', (job, result) => {
    console.log(`✅ Job ${job.id} completed successfully`);
    console.log('Result:', result);
  });

  emailQueue.on('failed', (job, error) => {
    console.error(`❌ Job ${job.id} failed:`, error.message);
  });

  setInterval(async () => {
    const stats = await getQueueStats();
    if (stats.waiting > 0 || stats.active > 0) {
      console.log('📊 Queue Stats:', stats);
    }
  }, 5000);
}

emailQueue.process('*', async (job) => {
  console.log(`🔄 Processing email job ${job.id}`);
  const { to, subject, html, text, from } = job.data;
  
  // Fixed mailOptions for queue processing
  const mailOptions = {
    from: from || process.env.EMAIL_USER, // Simple format
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>?/gm, '')
  };

  console.log(`📧 Sending email to: ${to}, Subject: ${subject}`);

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to send email in job ${job.id}:`, error);
    throw error;
  }
});

emailQueue.on('completed', (job, result) => {
  console.log(`Email job ${job.id} completed. MessageId: ${result.messageId}`);
});

emailQueue.on('failed', (job, error) => {
  console.error(`❌ Email job ${job.id} failed:`, error.message);
  console.error('Full error:', error);
});

emailQueue.on('stalled', (job) => {
  console.warn(`⚠️  Email job ${job.id} stalled`);
});

// Fixed sendTestEmail function
const sendTestEmail = async (email) => {
  if (!isValidEmail(email)) {
    throw new Error(`Invalid test email format: ${email}`);
  }

  const emailContent = `
    <div class="content-section">
        <h2>🧪 Test Email Successful!</h2>
        <p>Congratulations! Your email configuration is working perfectly. This beautifully designed test email confirms that your DK-HairSalon email system is ready to send professional communications to your clients.</p>
        
        <div class="info-card">
            <p><strong>System Status:</strong> ✅ All Green</p>
            <p><strong>Email Service:</strong> Active & Ready</p>
            <p><strong>Template:</strong> Salon Theme Applied</p>
        </div>
        
        <p>Your customers will now receive stylish, professional emails that match your salon's premium brand experience.</p>
    </div>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER, // Simple format
    to: email,
    subject: '🎉 Test Email - DK-HairSalon System Ready!',
    html: getEmailTemplate(emailContent, "Test Email - DK-HairSalon")
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('❌ Failed to send test email:', error);
    throw new Error(`Failed to send test email: ${error.message}`);
  }
};

// Fixed sendEmail function
const sendEmail = async ({ to, subject, html, text, from, type = 'general' }) => {
  if (!to || !subject || !html) {
    throw new Error('Missing required email parameters: to, subject, and html are required');
  }

  if (!isValidEmail(to)) {
    throw new Error(`Invalid recipient email format: ${to}`);
  }

  const emailData = {
    from: from || process.env.EMAIL_USER, // Simple format
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>?/gm, '')
  };
  
  if (useQueue) {
    return emailQueue.add(type, emailData);
  } else {
    return transporter.sendMail(emailData);
  }
};

// Fixed sendAppointmentConfirmation function
const sendAppointmentConfirmation = async (email, appointmentDetails) => {
  const { date, time, service, customerName } = appointmentDetails;
  
  if (!isValidEmail(email)) {
    throw new Error(`Invalid email format for appointment confirmation: ${email}`);
  }
  
  const emailContent = `
    <div class="content-section">
        <h2>🎉 Appointment Confirmed!</h2>
        <p>Hi ${customerName},</p>
        <p>Great news! Your appointment at DK-HairSalon has been successfully confirmed. We're excited to provide you with our signature grooming experience.</p>
        
        <div class="appointment-details">
            <p><strong>💼 Service:</strong> ${service}</p>
            <p><strong>📅 Date:</strong> ${date}</p>
            <p><strong>🕐 Time:</strong> ${time}</p>
            <p><strong>📍 Location:</strong> DK-HairSalon</p>
        </div>
        
        <div class="info-card">
            <p><strong>What to expect:</strong></p>
            <p>• Professional consultation</p>
            <p>• Premium grooming products</p>
            <p>• Relaxing salon atmosphere</p>
            <p>• Expert styling advice</p>
        </div>
        
        <p style="color: #7f8c8d; font-size: 14px; margin-top: 20px;">
            Need to reschedule? Contact us at least 2 hours before your appointment time.
        </p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `🎉 Your DK-HairSalon Appointment is Confirmed - ${date}`,
    from: process.env.EMAIL_USER,
    type: 'appointment',
    html: getEmailTemplate(emailContent, "Appointment Confirmed - DK-HairSalon")
  });
};

const sendPasswordResetEmail = async (email, token, userName = null) => {
  console.log(`📧 Attempting to send password reset email to: ${email}`);
  console.log(`🔗 Token: ${token}`);

  if (!isValidEmail(email)) {
    throw new Error(`Invalid recipient email format: ${email}`);
  }

  const resetURL = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  console.log(`🌐 Reset URL: ${resetURL}`);

  const emailContent = `
    <div class="content-section">
        <h2>🔐 Password Reset Request</h2>
        <p>Hi ${userName || 'there'},</p>
        <p>We received a request to reset your password for your DK-HairSalon account. If you didn't make this request, you can safely ignore this email.</p>
        
        <a href="${resetURL}" class="cta-button">
            🔄 Reset My Password
        </a>
        
        <div class="info-card">
            <p><strong>⚠️ Important Security Information:</strong></p>
            <p>• This link will expire in 10 minutes</p>
            <p>• You can only use this link once</p>
            <p>• If you didn't request this, please ignore</p>
            <p>• Never share this link with anyone</p>
        </div>
        
        <p style="color: #7f8c8d; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:
        </p>
        <div class="verification-link">
            ${resetURL}
        </div>
        
        <p style="color: #95a5a6; font-size: 13px; margin-top: 30px;">
            This password reset link will expire in 10 minutes for security reasons. If you need another reset link, please visit our forgot password page again.
        </p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: '🔐 Password Reset - DK-HairSalon',
    html: getEmailTemplate(emailContent, "Password Reset - DK-HairSalon"),
    type: 'password-reset'
  });
};

// Password Reset Confirmation Email Function
const sendPasswordResetConfirmation = async (email, userName = null) => {
  console.log(`📧 Sending password reset confirmation to: ${email}`);

  if (!isValidEmail(email)) {
    throw new Error(`Invalid recipient email format: ${email}`);
  }

  const emailContent = `
    <div class="content-section">
        <h2>✅ Password Reset Successful</h2>
        <p>Hi ${userName || 'there'},</p>
        <p>Your password has been successfully reset for your DK-HairSalon account.</p>
        
        <div class="info-card">
            <p><strong>🔐 Security Notice:</strong></p>
            <p>• Your password was changed on ${new Date().toLocaleString()}</p>
            <p>• If you didn't make this change, contact us immediately</p>
            <p>• Consider using a strong, unique password</p>
            <p>• Log in with your new password</p>
        </div>
        
        <a href="${process.env.CLIENT_URL}/login" class="cta-button">
            🚀 Login to Your Account
        </a>
        
        <p style="color: #95a5a6; font-size: 13px; margin-top: 30px;">
            If you didn't reset your password, please contact our support team immediately.
        </p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: '✅ Password Reset Successful - DK-HairSalon',
    html: getEmailTemplate(emailContent, "Password Reset Successful - DK-HairSalon"),
    type: 'password-reset-confirmation'
  });
};

// Fixed sendAppointmentReminder function
const sendAppointmentReminder = async (email, appointmentDetails) => {
  const { date, time, service, customerName } = appointmentDetails;
  
  if (!isValidEmail(email)) {
    throw new Error(`Invalid email format for appointment reminder: ${email}`);
  }
  
  const emailContent = `
    <div class="content-section">
        <h2>⏰ Appointment Reminder</h2>
        <p>Hi ${customerName},</p>
        <p>This is a friendly reminder about your upcoming appointment at DK-HairSalon. We're looking forward to seeing you soon!</p>
        
        <div class="appointment-details">
            <p><strong>💼 Service:</strong> ${service}</p>
            <p><strong>📅 Date:</strong> ${date}</p>
            <p><strong>🕐 Time:</strong> ${time}</p>
            <p><strong>📍 Location:</strong> DK-HairSalon</p>
        </div>
        
        <div class="info-card">
            <p><strong>🚗 Getting Ready:</strong></p>
            <p>• Arrive 10 minutes early</p>
            <p>• Bring any reference photos</p>
            <p>• Wear comfortable clothing</p>
            <p>• Come with clean, dry hair</p>
        </div>
        
        <p>We can't wait to give you an amazing grooming experience!</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `⏰ Reminder: Your DK-HairSalon Appointment Tomorrow`,
    from: process.env.EMAIL_USER,
    type: 'reminder',
    html: getEmailTemplate(emailContent, "Appointment Reminder - DK-HairSalon")
  });
};

const getQueueStats = async () => {
  if (!useQueue) {
    return { message: 'Queue not available, using direct email sending' };
  }
  
  const [waiting, active, completed, failed] = await Promise.all([
    emailQueue.getWaiting(),
    emailQueue.getActive(),
    emailQueue.getCompleted(),
    emailQueue.getFailed()
  ]);
  
  return {
    waiting: waiting.length,
    active: active.length,
    completed: completed.length,
    failed: failed.length
  };
};

const sendAppointmentConfirmationEmail = async (email, appointmentDetails, customerName) => {
  console.log(`📧 Sending appointment confirmation email to: ${email}`);
  
  if (!isValidEmail(email)) {
    throw new Error(`Invalid email format for appointment confirmation: ${email}`);
  }
  
  const { date, requestedTime, service, estimatedTime, appointmentId } = appointmentDetails;
  
  const emailContent = `
    <div class="content-section">
        <h2>🎉 Appointment Request Received!</h2>
        <p>Hi ${customerName},</p>
        <p>Great news! Your appointment request at DK-HairSalon has been received and is now being processed. We'll notify you once your barber confirms the appointment.</p>
        
        <div class="appointment-details">
            <p><strong>📋 Appointment ID:</strong> #${appointmentId}</p>
            <p><strong>💼 Service:</strong> ${service}</p>
            <p><strong>📅 Date:</strong> ${date}</p>
            <p><strong>🕐 Requested Time:</strong> ${requestedTime}</p>
            <p><strong>⏱️ Estimated Duration:</strong> ${estimatedTime} minutes</p>
        </div>
        
        <div class="info-card">
            <p><strong>📋 Current Status:</strong> Pending Approval</p>
            <p>Your appointment is waiting for barber confirmation. You'll receive another email once it's approved or if any changes are needed.</p>
        </div>
        
        <div class="info-card">
            <p><strong>💡 What happens next:</strong></p>
            <p>• Our barber will review your request</p>
            <p>• You'll get confirmation within 2 hours</p>
            <p>• Check your email for updates</p>
            <p>• View status in your dashboard</p>
        </div>
        
        <a href="${process.env.CLIENT_URL}/dashboard" class="cta-button">
            📱 View My Appointments
        </a>
        
        <p style="color: #7f8c8d; font-size: 14px; margin-top: 20px;">
            Need to make changes? Contact us at least 2 hours before your requested appointment time.
        </p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `🎉 Appointment Request Received - ${date} at ${requestedTime}`,
    html: getEmailTemplate(emailContent, "Appointment Confirmation - DK-HairSalon"),
    type: 'appointment-confirmation'
  });
};

// 2. APPOINTMENT APPROVED EMAIL (when status = approved)
const sendAppointmentApprovedEmail = async (email, appointmentDetails, customerName, barberName) => {
  console.log(`📧 Sending appointment approved email to: ${email}`);
  
  if (!isValidEmail(email)) {
    throw new Error(`Invalid email format for appointment approval: ${email}`);
  }
  
  const { date, startTime, requestedTime, service, estimatedTime, appointmentId, tokenNumber } = appointmentDetails;
  const confirmedTime = startTime || requestedTime;
  
  const emailContent = `
    <div class="content-section">
        <h2>✅ Appointment Approved & Confirmed!</h2>
        <p>Hi ${customerName},</p>
        <p>Excellent news! Your appointment at DK-HairSalon has been approved and confirmed. You've been added to our service queue and we're excited to provide you with our premium grooming experience.</p>
        
        <div class="appointment-details">
            <p><strong>📋 Appointment ID:</strong> #${appointmentId}</p>
            <p><strong>💼 Service:</strong> ${service}</p>
            <p><strong>📅 Date:</strong> ${date}</p>
            <p><strong>🕐 Confirmed Time:</strong> ${confirmedTime}</p>
            <p><strong>⏱️ Duration:</strong> ${estimatedTime} minutes</p>
            <p><strong>👨‍💼 Your Barber:</strong> ${barberName}</p>
            ${tokenNumber ? `<p><strong>🎫 Queue Token:</strong> ${tokenNumber}</p>` : ''}
        </div>
        
        <div class="info-card">
            <p><strong>🎯 Status:</strong> Approved & In Queue</p>
            <p>Your appointment is confirmed! You're now in our service queue and will be served at your scheduled time.</p>
        </div>
        
        <div class="info-card">
            <p><strong>🚗 Before you arrive:</strong></p>
            <p>• Arrive 10 minutes early for check-in</p>
            <p>• Bring any reference photos you'd like</p>
            <p>• Wear comfortable, loose-fitting clothing</p>
            <p>• Come with clean, dry hair for best results</p>
        </div>
        
        <a href="${process.env.CLIENT_URL}/dashboard" class="cta-button">
            📱 View Queue Status
        </a>
        
        <p style="color: #27ae60; font-weight: 600; text-align: center; margin-top: 20px;">
            🎉 We can't wait to give you an amazing grooming experience!
        </p>
        
        <p style="color: #7f8c8d; font-size: 14px; margin-top: 20px;">
            Need to reschedule? Please contact us at least 2 hours before your appointment time.
        </p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `✅ Appointment Confirmed & In Queue - ${date} at ${confirmedTime}`,
    html: getEmailTemplate(emailContent, "Appointment Approved - DK-HairSalon"),
    type: 'appointment-approved'
  });
};

// 3. APPOINTMENT REJECTED EMAIL (when status = rejected)
const sendAppointmentRejectedEmail = async (email, appointmentDetails, customerName, reason = null) => {
  console.log(`📧 Sending appointment rejection email to: ${email}`);
  
  if (!isValidEmail(email)) {
    throw new Error(`Invalid email format for appointment rejection: ${email}`);
  }
  
  const { date, requestedTime, service, appointmentId } = appointmentDetails;
  
  const emailContent = `
    <div class="content-section">
        <h2>😔 Appointment Update Required</h2>
        <p>Hi ${customerName},</p>
        <p>We're sorry to inform you that your appointment request at DK-HairSalon couldn't be confirmed for the requested time slot. Don't worry - we'd love to help you find an alternative time that works for both of us!</p>
        
        <div class="appointment-details">
            <p><strong>📋 Original Request ID:</strong> #${appointmentId}</p>
            <p><strong>💼 Service:</strong> ${service}</p>
            <p><strong>📅 Requested Date:</strong> ${date}</p>
            <p><strong>🕐 Requested Time:</strong> ${requestedTime}</p>
            ${reason ? `<p><strong>📝 Reason:</strong> ${reason}</p>` : ''}
        </div>
        
        <div class="info-card">
            <p><strong>🔄 Next Steps:</strong></p>
            <p>• Check our available time slots</p>
            <p>• Book a new appointment that fits your schedule</p>
            <p>• Contact us directly for personalized assistance</p>
            <p>• Consider our popular time slots for better availability</p>
        </div>
        
        <a href="${process.env.CLIENT_URL}/book-appointment" class="cta-button">
            📅 Book New Appointment
        </a>
        
        <div class="info-card">
            <p><strong>💡 Pro Tips for better availability:</strong></p>
            <p>• Weekday mornings typically have more openings</p>
            <p>• Book 2-3 days in advance when possible</p>
            <p>• Consider slightly different time slots (±30 minutes)</p>
            <p>• Call us for same-day availability updates</p>
        </div>
        
        <p style="color: #e67e22; font-weight: 600; text-align: center; margin-top: 20px;">
            We appreciate your understanding and look forward to serving you soon! 🙏
        </p>
        
        <p style="color: #7f8c8d; font-size: 14px; margin-top: 20px; text-align: center;">
            Questions? Contact us and we'll help you find the perfect time slot.
        </p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `📅 Appointment Update Needed - Let's Find You a Perfect Time!`,
    html: getEmailTemplate(emailContent, "Appointment Update - DK-HairSalon"),
    type: 'appointment-rejected'
  });
};

module.exports = { 
  sendEmail: sendVerificationEmail,
  sendTestEmail, 
  sendVerificationEmail,
  sendAppointmentConfirmation,
  sendAppointmentReminder,
  sendPasswordResetEmail,
  sendPasswordResetConfirmation,
  getQueueStats,
  sendAppointmentConfirmationEmail,
  sendAppointmentApprovedEmail,
  sendAppointmentRejectedEmail,
  getEmailTemplate,
  emailQueue
};