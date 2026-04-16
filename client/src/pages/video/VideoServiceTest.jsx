import React, { useState } from 'react';
import './VideoServiceTest.css';

const VIDEO_SERVICE_BASE_URL =
  process.env.REACT_APP_VIDEO_SERVICE_URL || 'http://localhost:3106';

const VideoServiceTest = () => {
  const [role, setRole] = useState('doctor'); // 'doctor' or 'patient'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Doctor states
  const [appointmentId, setAppointmentId] = useState('APT-12345');
  const [patientUserId, setPatientUserId] = useState('user-patient-1');
  
  // Patient states
  const [sessionId, setSessionId] = useState('');
  const [participantToken, setParticipantToken] = useState('');
  
  // Result
  const [sessionResult, setSessionResult] = useState(null);
  const [joinResult, setJoinResult] = useState(null);

  const handleCreateSession = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSessionResult(null);

    // Mocking the headers that the backend expects if JWT is not present
    // We mock being a doctor to create the room
    const headers = {
      'Content-Type': 'application/json',
      'x-user-id': 'user-doctor-1',
      'x-user-role': 'doctor',
      'x-user-name': 'Dr. Smith Mock'
    };

    try {
      const response = await fetch(`${VIDEO_SERVICE_BASE_URL}/video/sessions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          appointmentId: appointmentId,
          patientUserId: patientUserId,
          doctorUserId: 'user-doctor-1', // Match the mock ID
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create session');
      }

      setSessionResult(data);
      // Automatically fill patient form to make testing easier
      setSessionId(data.session.sessionId);
      setParticipantToken(data.join.participantToken);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setJoinResult(null);

    // Mocking the headers for the patient trying to join
    const headers = {
      'Content-Type': 'application/json',
      'x-user-id': patientUserId, // Must match the one the doctor invited
      'x-user-role': 'patient',
      'x-user-name': 'John Doe Mock Patient'
    };

    try {
      const response = await fetch(`${VIDEO_SERVICE_BASE_URL}/video/sessions/${sessionId}/join`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          participantToken: participantToken
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to join session');
      }

      setJoinResult(data);
      
      // Optionally open right away or let user click the link
      // window.open(data.meeting.url, '_blank');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="video-test-container">
      <div className="video-card">
        <h1 className="video-title">Video Consultation</h1>
        
        <div className="role-selector">
          <button 
            className={`role-btn ${role === 'doctor' ? 'active' : ''}`}
            onClick={() => setRole('doctor')}
          >
            Doctor (Create)
          </button>
          <button 
            className={`role-btn ${role === 'patient' ? 'active' : ''}`}
            onClick={() => setRole('patient')}
          >
            Patient (Join)
          </button>
        </div>

        {error && <div className="error-msg">{error}</div>}

        {role === 'doctor' ? (
          <form onSubmit={handleCreateSession}>
            <div className="form-group">
              <label className="form-label">Appointment ID</label>
              <input 
                type="text" 
                className="form-input" 
                value={appointmentId}
                onChange={(e) => setAppointmentId(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Patient User ID (To Invite)</label>
              <input 
                type="text" 
                className="form-input" 
                value={patientUserId}
                onChange={(e) => setPatientUserId(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="action-btn" disabled={loading}>
              {loading ? 'Creating...' : 'Create Video Session'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoinSession}>
            <div className="form-group">
              <label className="form-label">Session ID</label>
              <input 
                type="text" 
                className="form-input" 
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                required
                placeholder="Enter Session ID from Doctor"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Participant Token</label>
              <input 
                type="text" 
                className="form-input" 
                value={participantToken}
                onChange={(e) => setParticipantToken(e.target.value)}
                required
                placeholder="Enter Secret Token"
              />
            </div>
            <button type="submit" className="action-btn" disabled={loading || !sessionId || !participantToken}>
              {loading ? 'Joining...' : 'Get Joining Link'}
            </button>
          </form>
        )}

        {/* Doctor Results Display */}
        {role === 'doctor' && sessionResult && (
          <div className="result-box">
            <h3 className="result-title">Session Created Successfully!</h3>
            <div className="form-group">
              <label className="form-label">Session ID (Share with Patient):</label>
              <div className="result-text">{sessionResult.session.sessionId}</div>
            </div>
            <div className="form-group">
              <label className="form-label">Token (Share with Patient):</label>
              <div className="result-text">{sessionResult.join.participantToken}</div>
            </div>
            <p className="form-label" style={{marginTop: '1rem'}}>
              You can now switch to the Patient tab to test joining. The fields have been auto-filled for you.
            </p>
          </div>
        )}

        {/* Patient Results Display */}
        {role === 'patient' && joinResult && (
          <div className="result-box">
            <h3 className="result-title">Access Granted!</h3>
            <p className="form-label">Click below to enter the consultation room:</p>
            <a 
              href={joinResult.meeting.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="join-link"
            >
              Enter Jitsi Room
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoServiceTest;
