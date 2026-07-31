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

    return null;
  }
}

async function sendEmail(to, subject, html, options = {}) {
  const t = getTransporter();
  if (!t) return false;

  const MAX_RETRIES = 3;
  let delay = 1000; // Start with 1s

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const mailOptions = {
        from: process.env.MAIL_FROM || process.env.MAIL_USER || 'no-reply@gurujewellers.in',
        to,
        subject,
        html,
      };

      if (options.cc) mailOptions.cc = options.cc;
      if (options.bcc) mailOptions.bcc = options.bcc;
      if (options.replyTo) mailOptions.replyTo = options.replyTo;

      const defaultBcc = process.env.MAIL_BCC;
      if (!mailOptions.bcc && defaultBcc) mailOptions.bcc = defaultBcc;

      await t.sendMail(mailOptions);
      return true;
    } catch (err) {

      if (attempt === MAX_RETRIES) return false;
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
}

module.exports = { sendEmail };
