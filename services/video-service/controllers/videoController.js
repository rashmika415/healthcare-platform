const crypto = require('crypto');
const VideoSession = require('../models/VideoSession');

const SESSION_TTL_MS = 60 * 60 * 1000;

function buildRoomName(appointmentId) {
  const safeAppointment = String(appointmentId).replace(/[^a-zA-Z0-9_-]/g, '');
  return `healthcare-consult-${safeAppointment}-${crypto.randomBytes(4).toString('hex')}`;
}

function canCreateSession(role) {
  return role === 'patient' || role === 'doctor';
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
    const { id: requesterId, role } = req.user;
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

    const isParticipant =
      requesterId === session.patientUserId || requesterId === session.doctorUserId;
    if (!isParticipant) {
      return res.status(403).json({ error: 'You are not part of this consultation session' });
    }

    if (participantToken !== session.participantToken) {
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
