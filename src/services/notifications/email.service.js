const nodemailer = require('nodemailer');

let transporter;
function getTransporter() {
  if (transporter) return transporter;
  try {
    // Gmail configuration
    // Enable 2FA and generate App Password at: https://myaccount.google.com/apppasswords
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER, // your-email@gmail.com
        pass: process.env.MAIL_PASS  // 16-character App Password (not regular password)
      }
    });
    return transporter;
  } catch (e) {
    console.error('Failed to create mail transporter', e);
    return null;
  }
}

async function sendEmail(to, subject, html, options = {}) {
  const t = getTransporter();
  if (!t) return false;
  try {
    const mailOptions = {
      from: process.env.MAIL_FROM || process.env.MAIL_USER || 'no-reply@example.com',
      to,
      subject,
      html,
    };

    if (options.cc) mailOptions.cc = options.cc;
    if (options.bcc) mailOptions.bcc = options.bcc;
    if (options.replyTo) mailOptions.replyTo = options.replyTo;

    // Optional default BCC for internal tracking (do not hardcode personal emails)
    const defaultBcc = process.env.MAIL_BCC;
    if (!mailOptions.bcc && defaultBcc) mailOptions.bcc = defaultBcc;

    await t.sendMail(mailOptions);

    return true;
  } catch (err) {
    console.error('Email send failed', err.message);
    return false;
  }
}

module.exports = { sendEmail };
