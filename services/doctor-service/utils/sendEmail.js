const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    // Google App Passwords are often stored with spaces; nodemailer expects no spaces.
    pass: String(process.env.EMAIL_PASS || '').replace(/\s+/g, '')
  }
});

module.exports = async ({ to, subject, text }) => {
  await transporter.sendMail({
    from: `"Healthcare System" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text
  });
};