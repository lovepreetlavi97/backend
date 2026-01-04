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

async function sendEmail(to, subject, html) {
  const t = getTransporter();
  if (!t) return false;
  try {
    await t.sendMail({
      from: process.env.MAIL_FROM || process.env.MAIL_USER || 'no-reply@example.com',
      to:"lovepreetlavi697@gmail.com",
      subject,
      html
    });
    return true;
  } catch (err) {
    console.error('Email send failed', err.message);
    return false;
  }
}

module.exports = { sendEmail };
