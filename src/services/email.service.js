const nodemailer = require('nodemailer');
const { config, logger } = require('../config');

// Create transporter
const transporter = nodemailer.createTransport({
  host: config.email.smtp.host,
  port: config.email.smtp.port,
  secure: config.email.smtp.port === 465,
  auth: {
    user: config.email.smtp.auth.user,
    pass: config.email.smtp.auth.pass,
  },
});

// Verify connection on startup
if (config.env !== 'test') {
  transporter.verify((error, success) => {
    if (error) {
      logger.warn('Email service not available:', error.message);
    } else {
      logger.info('Email service is ready');
    }
  });
}

/**
 * Send an email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email HTML content
 * @param {string} text - Email plain text content
 */
const sendEmail = async (to, subject, html, text = '') => {
  const msg = {
    from: `"${config.email.fromName}" <${config.email.from}>`,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, ''),
  };

  try {
    const info = await transporter.sendMail(msg);
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Failed to send email to ${to}:`, error);
    throw error;
  }
};

/**
 * Send password reset email
 * @param {string} to - Recipient email
 * @param {string} token - Reset token
 */
const sendResetPasswordEmail = async (to, token) => {
  const subject = 'Reset Your Password';
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3001'}/reset-password?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { 
          display: inline-block; 
          padding: 12px 24px; 
          background-color: #007bff; 
          color: white !important; 
          text-decoration: none; 
          border-radius: 4px; 
          margin: 20px 0;
        }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Password Reset Request</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <a href="${resetUrl}" class="button">Reset Password</a>
        <p>If you didn't request this, you can safely ignore this email. Your password won't be changed.</p>
        <p>This link will expire in ${config.jwt.resetPasswordExpirationMinutes} minutes.</p>
        <div class="footer">
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p>${resetUrl}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(to, subject, html);
};

/**
 * Send email verification email
 * @param {string} to - Recipient email
 * @param {string} token - Verification token
 */
const sendVerificationEmail = async (to, token) => {
  const subject = 'Verify Your Email';
  const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:3001'}/verify-email?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { 
          display: inline-block; 
          padding: 12px 24px; 
          background-color: #28a745; 
          color: white !important; 
          text-decoration: none; 
          border-radius: 4px; 
          margin: 20px 0;
        }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Welcome! Please Verify Your Email</h2>
        <p>Hello,</p>
        <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
        <a href="${verifyUrl}" class="button">Verify Email</a>
        <p>This link will expire in ${config.jwt.verifyEmailExpirationMinutes} minutes.</p>
        <div class="footer">
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p>${verifyUrl}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(to, subject, html);
};

/**
 * Send welcome email
 * @param {string} to - Recipient email
 * @param {string} name - User's name
 */
const sendWelcomeEmail = async (to, name) => {
  const subject = 'Welcome to Our Platform!';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { 
          display: inline-block; 
          padding: 12px 24px; 
          background-color: #007bff; 
          color: white !important; 
          text-decoration: none; 
          border-radius: 4px; 
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Welcome, ${name}!</h2>
        <p>Thank you for joining us. We're excited to have you on board!</p>
        <p>Here are some things you can do:</p>
        <ul>
          <li>Complete your profile</li>
          <li>Browse our products</li>
          <li>Make your first purchase</li>
        </ul>
        <a href="${process.env.CLIENT_URL || 'http://localhost:3001'}" class="button">Get Started</a>
        <p>If you have any questions, feel free to reach out to our support team.</p>
      </div>
    </body>
    </html>
  `;

  await sendEmail(to, subject, html);
};

/**
 * Send order confirmation email
 * @param {string} to - Recipient email
 * @param {Object} order - Order details
 */
const sendOrderConfirmationEmail = async (to, order) => {
  const subject = `Order Confirmation - ${order.orderNumber}`;

  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">$${item.price.toFixed(2)}</td>
      </tr>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 10px; background-color: #f5f5f5; }
        .total { font-size: 18px; font-weight: bold; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Order Confirmation</h2>
        <p>Thank you for your order! Here are your order details:</p>
        <p><strong>Order Number:</strong> ${order.orderNumber}</p>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <p class="total">Total: $${order.pricing.total.toFixed(2)}</p>
        <h3>Shipping Address</h3>
        <p>
          ${order.shippingAddress.fullName}<br>
          ${order.shippingAddress.address}<br>
          ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}<br>
          ${order.shippingAddress.country}
        </p>
        <p>We'll send you another email when your order ships.</p>
      </div>
    </body>
    </html>
  `;

  await sendEmail(to, subject, html);
};

module.exports = {
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
};
