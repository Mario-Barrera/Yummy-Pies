const nodemailer = require('nodemailer');
require('dotenv').config();

async function sendEmail(to, subject, text) {
  try {
    // Create a transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST, // e.g., "smtp.gmail.com"
      port: process.env.EMAIL_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER, // your email
        pass: process.env.EMAIL_PASS  // your email password or app password
      }
    });

    // Send the email
    const info = await transporter.sendMail({
      from: `"Yummy Pies" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,      // fallback plain text
      html: `<p>Click <a href="${text}">here</a> to reset your password</p>` // HTML version
    });

    console.log('Email sent:', info.messageId);
  } catch (err) {
    console.error('Error sending email:', err);
  }
}

module.exports = sendEmail;
