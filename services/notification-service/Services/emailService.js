const nodemailer = require("nodemailer");

const normalizeEnv = (value) => String(value || "").trim();
const normalizePassword = (value) => normalizeEnv(value).replace(/\s+/g, "");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: normalizeEnv(process.env.EMAIL_USER),
    pass: normalizePassword(process.env.EMAIL_PASS),
  },
});

const sendEmail = async ({ to, subject, html }) => {
  const smtpUser = normalizeEnv(process.env.EMAIL_USER);
  const smtpPass = normalizePassword(process.env.EMAIL_PASS);

  if (!smtpUser || !smtpPass || /^change-me/i.test(smtpUser)) {
    throw new Error(
      "Notification email is not configured. Set EMAIL_USER and EMAIL_PASS."
    );
  }

  return transporter.sendMail({
    from: normalizeEnv(process.env.EMAIL_FROM) || smtpUser,
    to,
    subject,
    html,
  });
};

module.exports = { sendEmail };