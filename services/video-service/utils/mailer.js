const nodemailer = require('nodemailer');

function isEmailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.EMAIL_FROM
  );
}

function getTransporter() {
  const port = Number(process.env.SMTP_PORT);
  const secure =
    process.env.SMTP_SECURE === 'true' ||
    port === 465;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function formatWhen(scheduledAt, fallbackText) {
  if (!scheduledAt) return fallbackText || 'Not specified';
  const d = new Date(scheduledAt);
  if (Number.isNaN(d.getTime())) return fallbackText || String(scheduledAt);
  return d.toLocaleString();
}

async function sendSessionCreatedEmails({
  doctorEmail,
  patientEmail,
  doctorName,
  patientName,
  appointmentId,
  meetingUrl,
  scheduledAt,
}) {
  if (!isEmailConfigured()) {
    return { skipped: true, reason: 'SMTP not configured' };
  }

  const toList = [doctorEmail, patientEmail].filter(Boolean);
  if (toList.length === 0) {
    return { skipped: true, reason: 'No recipient emails provided' };
  }

  const whenText = formatWhen(scheduledAt, 'Appointment time not provided');
  const subject = `Video consultation session ready (Appointment ${appointmentId})`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2 style="margin: 0 0 8px;">Video Consultation Session Ready</h2>
      <p style="margin: 0 0 8px;">
        Your video consultation session has been created.
      </p>
      <ul style="margin: 0 0 12px; padding-left: 18px;">
        <li><b>Appointment ID:</b> ${String(appointmentId)}</li>
        <li><b>Doctor:</b> ${doctorName ? String(doctorName) : 'Doctor'}</li>
        <li><b>Patient:</b> ${patientName ? String(patientName) : 'Patient'}</li>
        <li><b>Time:</b> ${whenText}</li>
      </ul>
      <p style="margin: 0 0 12px;">
        <b>Join link:</b><br/>
        <a href="${meetingUrl}" target="_blank" rel="noreferrer">${meetingUrl}</a>
      </p>
      <p style="margin: 0; color: #666; font-size: 12px;">
        If you did not expect this email, you can ignore it.
      </p>
    </div>
  `;

  const transporter = getTransporter();
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: toList.join(','),
    subject,
    html,
  });

  return { skipped: false, messageId: info.messageId, accepted: info.accepted };
}

module.exports = {
  isEmailConfigured,
  sendSessionCreatedEmails,
};

