const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const VideoSession = require('../models/VideoSession');

const SESSION_TTL_MS = 60 * 60 * 1000;
const normalizeBaseUrl = (value) => String(value || '').trim().replace(/\/$/, '');

const appointmentServiceBases = () => {
  const envBase = normalizeBaseUrl(process.env.APPOINTMENT_SERVICE_URL);
  return [
    ...new Set(
      [envBase, 'http://appointment-service:3003', 'http://localhost:3003'].filter(Boolean)
    )
  ];
};

const doctorServiceBases = () => {
  const envBase = normalizeBaseUrl(process.env.DOCTOR_SERVICE_URL);
  return [
    ...new Set(
      [envBase, 'http://doctor-service:3002', 'http://localhost:3002'].filter(Boolean)
    )
  ];
};

function buildRoomName(appointmentId) {
  // Deterministic room name based strictly on appointment ID to ensure all parties join the same meeting
  const safeAppointment = String(appointmentId).replace(/[^a-zA-Z0-9_-]/g, '');
  return `healthcare-consult-${safeAppointment}`;
}

function canCreateSession(role) {
  return role === 'patient' || role === 'doctor';
}

/**
 * Maps Auth User ID to Doctor Profile ID if necessary
 */
async function resolveRequesterIds(req) {
  const { id: requesterId, role } = req.user;
  let activeDoctorProfileId = null;

  if (role === 'doctor') {
    for (const baseUrl of doctorServiceBases()) {
      try {
        const resp = await axios.get(`${baseUrl}/profile`, {
          headers: {
            'x-user-id': req.headers['x-user-id'] || requesterId,
            'x-user-role': req.headers['x-user-role'] || 'doctor',
            'Authorization': req.headers['authorization']
          },
          timeout: 2000
        });

        const doctorData = resp.data?.doctor || resp.data;
        activeDoctorProfileId = doctorData?._id ? String(doctorData._id) : null;
        break;
      } catch (err) {
        console.warn(`[Video] resolveRequesterIds: doctor profile lookup failed via ${baseUrl} (${err.message})`);
      }
    }
    if (!activeDoctorProfileId) {
      console.warn('[Video] resolveRequesterIds: Falling back to Auth user ID for doctor matching.');
    }
  }

  return {
    userId: String(requesterId || '').trim(),
    doctorProfileId: activeDoctorProfileId ? String(activeDoctorProfileId).trim() : null
  };
}

exports.createSession = async (req, res) => {
  try {
    const { role, id: requesterId } = req.user;
    const { appointmentId, patientUserId, doctorUserId } = req.body || {};

    if (!canCreateSession(role)) {
      return res.status(403).json({ error: 'Only patients or doctors can create sessions' });
    }

    if (!appointmentId || !patientUserId || !doctorUserId) {
      return res.status(400).json({
        error: 'appointmentId, patientUserId, and doctorUserId are required'
      });
    }

    if (role === 'patient' && requesterId !== patientUserId) {
      return res.status(403).json({ error: 'Patient can only create own consultation session' });
    }

    if (role === 'doctor' && requesterId !== doctorUserId) {
      return res.status(403).json({ error: 'Doctor can only create own consultation session' });
    }

    const sessionId = crypto.randomUUID();
    const participantToken = crypto.randomBytes(24).toString('hex');
    const roomName = buildRoomName(appointmentId);
    
    // Set expiration
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    // Create session in DB
    const session = await VideoSession.create({
      sessionId,
      appointmentId,
      patientUserId,
      doctorUserId,
      roomName,
      participantToken,
      expiresAt
    });

    return res.status(201).json({
      message: 'Video consultation session created',
      session: {
        sessionId,
        appointmentId,
        roomName,
        expiresAt: session.expiresAt
      },
      join: {
        endpoint: `/video/sessions/${sessionId}/join`,
        participantToken
      }
    });

  } catch (error) {
    console.error('Error in createSession:', error);
    return res.status(500).json({ error: 'Internal server error while creating session' });
  }
};

exports.joinSession = async (req, res) => {
  try {
    const { role } = req.user;
    const { sessionId } = req.params;
    const { participantToken } = req.body || {};

    if (!participantToken) {
      return res.status(400).json({ error: 'participantToken is required' });
    }

    const session = await VideoSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (Date.now() > new Date(session.expiresAt).getTime()) {
      await VideoSession.deleteOne({ sessionId });
      return res.status(410).json({ error: 'Session expired' });
    }

    const { userId: requesterId, doctorProfileId } = await resolveRequesterIds(req);
    
    // Check both Auth User ID AND Profile ID to ensure universal matching
    const isParticipant =
      String(requesterId) === String(session.patientUserId) || 
      String(requesterId) === String(session.doctorUserId) ||
      (doctorProfileId && String(doctorProfileId) === String(session.doctorUserId));

    if (!isParticipant) {
      console.warn(`[Video] Unauthorized join attempt for session ${sessionId} by user ${requesterId}`);
      return res.status(403).json({ error: 'You are not part of this consultation session' });
    }

    if (String(participantToken).trim() !== String(session.participantToken).trim()) {
      return res.status(403).json({ error: 'Invalid participant token' });
    }

    const baseUrl = process.env.JITSI_BASE_URL || 'https://meet.jit.si';
    const displayName = encodeURIComponent(req.user.name || role || 'Participant');
    const jitsiUrl = `${baseUrl}/${session.roomName}#userInfo.displayName="${displayName}"`;

    return res.status(200).json({
      message: 'Session join authorized',
      meeting: {
        provider: 'jitsi',
        roomName: session.roomName,
        url: jitsiUrl,
        sessionExpiresAt: session.expiresAt
      }
    });

  } catch (error) {
    console.error('Error in joinSession:', error);
    return res.status(500).json({ error: 'Internal server error while joining session' });
  }
};

exports.getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await VideoSession.findOne({ sessionId });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (Date.now() > new Date(session.expiresAt).getTime()) {
      await VideoSession.deleteOne({ sessionId });
      return res.status(410).json({ error: 'Session expired' });
    }

    return res.status(200).json({
      session: {
        sessionId: session.sessionId,
        appointmentId: session.appointmentId,
        patientUserId: session.patientUserId,
        doctorUserId: session.doctorUserId,
        roomName: session.roomName,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt
      }
    });

  } catch (error) {
    console.error('Error in getSession:', error);
    return res.status(500).json({ error: 'Internal server error while fetching session' });
  }
};

/**
 * Automatically fetch an existing session for an appointment OR create one
 * if the appointment is approved (status: BOOKED).
 * This allows both doctor and patient to get the join details easily.
 */
exports.getOrCreateSessionByAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { role } = req.user;

    if (!appointmentId) {
      return res.status(400).json({ error: 'appointmentId is required' });
    }

    // 1. Check if a non-expired session already exists
    let session = await VideoSession.findOne({ appointmentId });
    
    if (session) {
      // Check if expired
      if (Date.now() > new Date(session.expiresAt).getTime()) {
        await VideoSession.deleteOne({ _id: session._id });
        session = null;
      }
    }

    if (session) {
      // Verify authorization: Is the requester part of this session?
      const { userId: requesterId, doctorProfileId } = await resolveRequesterIds(req);
      
      const isParticipant = 
        String(requesterId) === String(session.patientUserId) || 
        String(requesterId) === String(session.doctorUserId) ||
        (doctorProfileId && String(doctorProfileId) === String(session.doctorUserId));

      if (!isParticipant) {
        return res.status(403).json({ error: 'You are not authorized for this consultation' });
      }

      return res.status(200).json({
        message: 'Existing session found',
        session: {
          sessionId: session.sessionId,
          appointmentId: session.appointmentId,
          roomName: session.roomName,
          expiresAt: session.expiresAt
        },
        join: {
          endpoint: `/video/sessions/${session.sessionId}/join`,
          participantToken: session.participantToken
        }
      });
    }

    // 2. No session exists, fetch appointment details to verify and auto-create
    let appointment;
    let fetched = false;
    for (const baseUrl of appointmentServiceBases()) {
      try {
        const resp = await axios.get(`${baseUrl}/appointments/getappointmentbyid/${appointmentId}`, { timeout: 3000 });
        appointment = resp.data?.appointment;
        fetched = true;
        break;
      } catch (err) {
        console.warn(`[Video] Failed to fetch appointment via ${baseUrl}:`, err.message);
      }
    }

    if (!fetched) {
      return res.status(404).json({ error: 'Appointment not found or appointment service unavailable' });
    }

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // 3. Verify status (Approved in this system is "BOOKED" or "accepted")
    const validStatuses = ['booked', 'accepted', 'confirmed'];
    const currentStatus = String(appointment.status || '').toLowerCase().trim();
    if (!validStatuses.includes(currentStatus)) {
      console.warn(`[Video] getOrCreateSessionByAppointment: Invalid status '${appointment.status}' for appointment ${appointmentId}`);
      return res.status(400).json({ 
        error: `Session cannot be created. Appointment status is '${appointment.status}'. Must be one of: ${validStatuses.join(', ')}.` 
      });
    }

    // 4. Verify authorization: Is the requester the doctor or patient of this appointment?
    const { userId: requesterId, doctorProfileId } = await resolveRequesterIds(req);
    const docIdInAppt = String(appointment.doctorId);
    const patIdInAppt = String(appointment.patientId);

    const isDoctor = String(requesterId) === docIdInAppt || (doctorProfileId && String(doctorProfileId) === docIdInAppt);
    const isPatient = String(requesterId) === patIdInAppt;
    
    if (!isDoctor && !isPatient) {
      return res.status(403).json({ error: 'You are not a participant in this appointment' });
    }

    // 5. Create new session
    const sessionId = crypto.randomUUID();
    const participantToken = crypto.randomBytes(24).toString('hex');
    const roomName = buildRoomName(appointmentId);
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    session = await VideoSession.create({
      sessionId,
      appointmentId,
      patientUserId: appointment.patientId,
      doctorUserId: appointment.doctorId,
      roomName,
      participantToken,
      expiresAt
    });

    console.log(`✅ Auto-created video session for approved appointment: ${appointmentId}`);

    return res.status(201).json({
      message: 'Video consultation session auto-created',
      session: {
        sessionId,
        appointmentId,
        roomName,
        expiresAt: session.expiresAt
      },
      join: {
        endpoint: `/video/sessions/${sessionId}/join`,
        participantToken
      }
    });

  } catch (error) {
    console.error('Error in getOrCreateSessionByAppointment:', error);
    return res.status(500).json({ error: 'Internal server error while handling appointment session' });
  }
};

/**
 * Participant action: delete an active session by appointment
 * (patient/doctor who belongs to the session).
 */
exports.deleteSessionByAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    if (!appointmentId) {
      return res.status(400).json({ error: 'appointmentId is required' });
    }

    const session = await VideoSession.findOne({ appointmentId });
    if (!session) {
      // Keep delete idempotent: if no active session exists, treat as successful.
      return res.status(200).json({
        message: 'No active consultation session found',
        deleted: false
      });
    }

    const { userId: requesterId, doctorProfileId } = await resolveRequesterIds(req);
    const isParticipant =
      String(requesterId) === String(session.patientUserId) ||
      String(requesterId) === String(session.doctorUserId) ||
      (doctorProfileId && String(doctorProfileId) === String(session.doctorUserId));

    if (!isParticipant) {
      return res.status(403).json({ error: 'You are not authorized to delete this consultation session' });
    }

    await VideoSession.deleteOne({ _id: session._id });
    return res.status(200).json({
      message: 'Consultation session deleted successfully',
      deleted: true
    });
  } catch (error) {
    console.error('Error in deleteSessionByAppointment:', error);
    return res.status(500).json({ error: 'Internal server error while deleting session' });
  }
};

/**
 * Admin: Get all active sessions
 */
exports.adminGetAllSessions = async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const sessions = await VideoSession.find().sort({ createdAt: -1 });
    
    // Auto-cleanup expired sessions on the fly if needed
    const now = Date.now();
    const activeSessions = [];
    
    for (const session of sessions) {
      if (now > new Date(session.expiresAt).getTime()) {
        await VideoSession.deleteOne({ _id: session._id });
      } else {
        activeSessions.push(session);
      }
    }

    return res.status(200).json({
      totalActive: activeSessions.length,
      sessions: activeSessions
    });
  } catch (error) {
    console.error('Error in adminGetAllSessions:', error);
    return res.status(500).json({ error: 'Internal server error while fetching all sessions' });
  }
};

/**
 * Admin: Force delete a session
 */
exports.adminDeleteSession = async (req, res) => {
  try {
    const { role } = req.user;
    const { sessionId } = req.params;

    if (role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const result = await VideoSession.deleteOne({ sessionId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    return res.status(200).json({ message: 'Session terminated successfully' });
  } catch (error) {
    console.error('Error in adminDeleteSession:', error);
    return res.status(500).json({ error: 'Internal server error while taking admin action' });
  }
};
