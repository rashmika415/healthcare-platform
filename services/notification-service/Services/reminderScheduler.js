const axios = require('axios');
const Notification = require('../Models/NotificationModel');
const { sendEmail } = require('./emailService');

const APPOINTMENT_SERVICE_URL = (process.env.APPOINTMENT_SERVICE_URL || 'http://appointment-service:3003').replace(/\/$/, '');
const PATIENT_SERVICE_URL = (process.env.PATIENT_SERVICE_URL || 'http://patient-service:3001').replace(/\/$/, '');
const SCHEDULER_INTERVAL_MS = Math.max(Number(process.env.REMINDER_SCHEDULER_INTERVAL_MS || 60000), 15000);

let schedulerHandle = null;
let isRunningCycle = false;

const parseDateTime = (dateValue, timeValue) => {
  if (!dateValue) return null;

  const datePart = String(dateValue).trim().slice(0, 10);
  const timeText = String(timeValue || '').trim();
  let normalizedTime = '00:00';

  if (/^\d{2}:\d{2}$/.test(timeText)) {
    normalizedTime = timeText;
  } else {
    const twelveHourMatch = timeText.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
    if (twelveHourMatch) {
      let hour = Number(twelveHourMatch[1]);
      const minute = twelveHourMatch[2];
      const meridiem = twelveHourMatch[3].toUpperCase();
      if (meridiem === 'PM' && hour < 12) hour += 12;
      if (meridiem === 'AM' && hour === 12) hour = 0;
      normalizedTime = `${String(hour).padStart(2, '0')}:${minute}`;
    }
  }

  const parsed = new Date(`${datePart}T${normalizedTime}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString();
};

const normalizeMealAdvice = (text) => {
  const lower = String(text || '').toLowerCase();
  if (lower.includes('before food') || lower.includes('before meal')) return 'Before food';
  if (lower.includes('after food') || lower.includes('after meal')) return 'After food';
  return 'As advised';
};

const inferMedicineSlots = (medicine = {}, prescription = {}) => {
  const context = [medicine.dosage, medicine.duration, medicine.notes, prescription.instructions]
    .map((v) => String(v || '').toLowerCase())
    .join(' ');

  const slots = [];

  if (context.includes('thrice daily') || context.includes('three times')) {
    slots.push({ label: 'morning', hour: 8, minute: 0 });
    slots.push({ label: 'afternoon', hour: 13, minute: 0 });
    slots.push({ label: 'night', hour: 21, minute: 0 });
  } else if (context.includes('twice daily') || context.includes('two times')) {
    slots.push({ label: 'morning', hour: 8, minute: 0 });
    slots.push({ label: 'evening', hour: 20, minute: 0 });
  } else if (context.includes('night')) {
    slots.push({ label: 'night', hour: 21, minute: 0 });
  } else if (context.includes('afternoon') || context.includes('noon')) {
    slots.push({ label: 'afternoon', hour: 13, minute: 0 });
  } else if (context.includes('evening')) {
    slots.push({ label: 'evening', hour: 19, minute: 0 });
  } else {
    slots.push({ label: 'morning', hour: 8, minute: 0 });
  }

  return {
    slots,
    mealAdvice: normalizeMealAdvice(context)
  };
};

const createNotificationIfMissing = async ({
  patientId,
  appointmentId,
  type,
  message,
  dedupeKey,
  metadata
}) => {
  if (!dedupeKey) return null;

  const existing = await Notification.findOne({ dedupeKey }).lean();
  if (existing) return null;

  return Notification.create({
    patientId,
    appointmentId,
    type,
    message,
    dedupeKey,
    metadata: metadata || null
  });
};

const patchAppointment = async (appointmentId, payload) => {
  if (!appointmentId) return;
  try {
    await axios.put(`${APPOINTMENT_SERVICE_URL}/appointments/updateappointment/${appointmentId}`, payload, { timeout: 10000 });
  } catch (err) {
    console.warn('patchAppointment failed:', err.message);
  }
};

const fetchAppointments = async () => {
  const { data } = await axios.get(`${APPOINTMENT_SERVICE_URL}/appointments/getallappointments`, { timeout: 12000 });
  return Array.isArray(data?.appointments) ? data.appointments : [];
};

const fetchPatient = async (patientId) => {
  const { data } = await axios.get(`${PATIENT_SERVICE_URL}/patients/internal/${encodeURIComponent(String(patientId || ''))}`, {
    timeout: 12000,
    headers: {
      'x-user-id': 'reminder-engine',
      'x-user-role': 'service',
      'x-user-email': 'system@healthcare.local',
      'x-user-name': 'Reminder Engine'
    }
  });
  return data;
};

const sendReminderEmail = async ({ to, subject, html }) => {
  if (!to) return;
  try {
    await sendEmail({ to, subject, html });
  } catch (err) {
    console.warn('sendReminderEmail failed:', err.message);
  }
};

const processAppointmentReminders = async (appointments, now) => {
  for (const appt of appointments) {
    const status = String(appt?.status || '').toUpperCase();
    if (status === 'CANCELLED') continue;

    const appointmentDate = parseDateTime(appt?.date, appt?.time);
    if (!appointmentDate) continue;

    const diffMs = appointmentDate.getTime() - now.getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const oneHour = 60 * 60 * 1000;

    if (
      diffMs <= twentyFourHours
      && diffMs > twentyFourHours - 30 * 60 * 1000
      && !appt?.appointmentReminder24hSentAt
    ) {
      const message = `Reminder: You have an appointment with Dr. ${appt.doctorName} in 24 hours (${formatDate(appointmentDate)} at ${appt.time}).`;
      const dedupeKey = `appointment-24h-${appt._id}`;
      const created = await createNotificationIfMissing({
        patientId: appt.patientId,
        appointmentId: appt._id,
        type: 'APPOINTMENT_REMINDER_24H',
        message,
        dedupeKey,
        metadata: { reminderWindow: '24h' }
      });

      if (created) {
        await sendReminderEmail({
          to: appt.patientEmail,
          subject: 'Appointment Reminder - 24 hours',
          html: `<p>${message}</p>`
        });
        await patchAppointment(appt._id, { appointmentReminder24hSentAt: new Date().toISOString() });
      }
    }

    if (
      diffMs <= oneHour
      && diffMs > 0
      && !appt?.appointmentReminder1hSentAt
    ) {
      const message = `Reminder: Your appointment with Dr. ${appt.doctorName} starts in about 1 hour (${appt.time}).`;
      const dedupeKey = `appointment-1h-${appt._id}`;
      const created = await createNotificationIfMissing({
        patientId: appt.patientId,
        appointmentId: appt._id,
        type: 'APPOINTMENT_REMINDER_1H',
        message,
        dedupeKey,
        metadata: { reminderWindow: '1h' }
      });

      if (created) {
        await sendReminderEmail({
          to: appt.patientEmail,
          subject: 'Appointment Reminder - 1 hour',
          html: `<p>${message}</p>`
        });
        await patchAppointment(appt._id, { appointmentReminder1hSentAt: new Date().toISOString() });
      }
    }

    if (status === 'COMPLETED' && !appt?.followUpReminderSentAt) {
      const completedTime = appt?.completedAt ? new Date(appt.completedAt) : new Date(appt.updatedAt || appt.createdAt);
      if (!Number.isNaN(completedTime.getTime())) {
        const elapsed = now.getTime() - completedTime.getTime();
        const followUpDelay = 24 * 60 * 60 * 1000;

        if (elapsed >= followUpDelay) {
          const message = `Follow-up reminder: Please review your recovery plan and book a follow-up consultation if symptoms persist.`;
          const dedupeKey = `followup-${appt._id}`;
          const created = await createNotificationIfMissing({
            patientId: appt.patientId,
            appointmentId: appt._id,
            type: 'FOLLOW_UP_REMINDER',
            message,
            dedupeKey,
            metadata: { followUpAfterHours: 24 }
          });

          if (created) {
            await sendReminderEmail({
              to: appt.patientEmail,
              subject: 'Follow-up Reminder',
              html: `<p>${message}</p>`
            });
            await patchAppointment(appt._id, { followUpReminderSentAt: new Date().toISOString() });
          }
        }
      }
    }
  }
};

const processMedicineReminders = async (appointments, now) => {
  const patientIds = [...new Set((appointments || []).map((appt) => String(appt?.patientId || '').trim()).filter(Boolean))];
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  for (const patientId of patientIds) {
    try {
      const patient = await fetchPatient(patientId);
      const prescriptions = [...(patient?.prescriptions || [])].sort((a, b) => {
        const aTime = new Date(a?.issuedAt || 0).getTime();
        const bTime = new Date(b?.issuedAt || 0).getTime();
        return bTime - aTime;
      });
      const latestPrescription = prescriptions[0];
      if (!latestPrescription) continue;

      const medicines = latestPrescription.medicines || [];
      for (const med of medicines) {
        const { slots, mealAdvice } = inferMedicineSlots(med, latestPrescription);
        for (const slot of slots) {
          const slotTime = new Date(now);
          slotTime.setHours(slot.hour, slot.minute, 0, 0);
          const diffMinutes = Math.abs(now.getTime() - slotTime.getTime()) / (1000 * 60);

          if (diffMinutes <= 5) {
            const medName = String(med?.name || 'Medicine').trim();
            const dosage = String(med?.dosage || 'As prescribed').trim();
            const message = `Medicine reminder: Take ${medName} (${dosage}) ${slot.label}. Meal instruction: ${mealAdvice}.`;
            const dedupeKey = `medicine-${patientId}-${medName.toLowerCase()}-${todayKey}-${slot.label}`;

            const created = await createNotificationIfMissing({
              patientId,
              appointmentId: latestPrescription.appointmentId || null,
              type: 'MEDICINE_REMINDER',
              message,
              dedupeKey,
              metadata: {
                medicine: medName,
                dosage,
                slot: slot.label,
                mealAdvice
              }
            });

            if (created) {
              await sendReminderEmail({
                to: patient?.email,
                subject: `Medicine Reminder - ${medName}`,
                html: `<p>${message}</p>`
              });
            }
          }
        }
      }
    } catch (err) {
      console.warn(`processMedicineReminders failed for patient ${patientId}:`, err.message);
    }
  }
};

const runReminderCycle = async () => {
  if (isRunningCycle) return;
  isRunningCycle = true;

  try {
    const now = new Date();
    const appointments = await fetchAppointments();
    await processAppointmentReminders(appointments, now);
    await processMedicineReminders(appointments, now);
  } catch (err) {
    console.error('runReminderCycle error:', err.message);
  } finally {
    isRunningCycle = false;
  }
};

const startReminderScheduler = () => {
  if (schedulerHandle) return;
  schedulerHandle = setInterval(runReminderCycle, SCHEDULER_INTERVAL_MS);
  runReminderCycle().catch(() => {});
  console.log(`Reminder scheduler started (interval: ${SCHEDULER_INTERVAL_MS}ms)`);
};

module.exports = {
  startReminderScheduler,
  runReminderCycle
};
