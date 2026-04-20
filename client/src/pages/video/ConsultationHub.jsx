import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { getOrCreateSessionByAppointment, joinSession, deleteSessionByAppointment } from '../../services/videoApi';
import { useAuth } from '../../context/AuthContext';
import PatientLayout from '../patient/Patientlayout '; // Using existing layout for consistency
import { toast, Toaster } from 'react-hot-toast';

export default function ConsultationHub() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joiningId, setJoiningId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchApprovedAppointments();
  }, []);

  const fetchApprovedAppointments = async () => {
    try {
      setLoading(true);
      setError('');

      const role = user?.role || 'patient';
      const userId = user?.id || user?._id;

      // Fetch appointments for this user
      // We target the appointment service
      const endpoint = role === 'doctor'
        ? `/appointments/doctor/${userId}`
        : `/appointments/patient/${userId}`;

      const response = await api.get(endpoint);
      const list = response.data?.appointments || [];

      // Filter for approved/booked appointments
      const active = list.filter(appt => appt.status === 'BOOKED' || appt.status === 'confirmed' || appt.status === 'accepted');
      setAppointments(active);
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
      setError('Could not load your consultations.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCall = async (appointmentId) => {
    try {
      setJoiningId(appointmentId);

      // 1. Get or create session
      const sessionData = await getOrCreateSessionByAppointment(appointmentId);

      // 2. Join session to get the Jitsi URL
      const joinData = await joinSession(sessionData.session.sessionId, sessionData.join.participantToken);

      // 3. Open in new tab
      if (joinData.meeting?.url) {
        window.open(joinData.meeting.url, '_blank');
        toast.success('Consultation room opened!');
      } else {
        throw new Error('No meeting URL received');
      }
    } catch (err) {
      console.error('Video join error:', err);
      toast.error(err.response?.data?.error || 'Failed to enter consultation.');
    } finally {
      setJoiningId(null);
    }
  };

  const handleDeleteSession = async (appointmentId) => {
    if (!window.confirm('Delete this consultation session? You can create it again later by joining.')) {
      return;
    }
    try {
      setDeletingId(appointmentId);
      await deleteSessionByAppointment(appointmentId);
      setAppointments((prev) => prev.filter((appt) => appt._id !== appointmentId));
      toast.success('Consultation removed from your list');
    } catch (err) {
      console.error('Delete session error:', err);
      // Backward compatibility if server still returns 404 for missing session.
      if (err.response?.status === 404) {
        setAppointments((prev) => prev.filter((appt) => appt._id !== appointmentId));
        toast.success('No active session found; removed from your list');
      } else {
        toast.error(err.response?.data?.error || 'Failed to delete consultation session.');
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <PatientLayout title="Consultation Hub" subtitle="Enter your digital clinic rooms">
      <Toaster position="top-center" />
      <style>{hubStyles}</style>

      {loading ? (
        <div className="hub-loader-container">
          <div className="hub-spinner" />
          <p>Scanning active sessions...</p>
        </div>
      ) : error ? (
        <div className="hub-error-box">{error}</div>
      ) : appointments.length === 0 ? (
        <div className="hub-empty-state">
          <div className="hub-empty-icon">🎥</div>
          <h3>No Active Consultations</h3>
          <p>Book an appointment to start a video consultation.</p>
          <button onClick={() => navigate('/appointments')} className="hub-cta-btn">Find a Doctor</button>
        </div>
      ) : (
        <div className="hub-grid">
          {appointments.map((appt) => (
            <div key={appt._id} className="hub-card">
              <div className="hub-card-header">
                <div className="hub-avatar">
                  {user.role === 'doctor' ? (appt.patientName?.charAt(0) || 'P') : (appt.doctorName?.charAt(0) || 'D')}
                </div>
                <div className="hub-meta">
                  <h4>{user.role === 'doctor' ? appt.patientName : `Dr. ${appt.doctorName}`}</h4>
                  <span>{appt.specialization || 'General Consultation'}</span>
                </div>
              </div>

              <div className="hub-details">
                <div className="hub-detail-item">
                  <span className="hub-icon">📅</span>
                  <span>{new Date(appt.date).toLocaleDateString()}</span>
                </div>
                <div className="hub-detail-item">
                  <span className="hub-icon">🕙</span>
                  <span>{appt.timeSlot || appt.time || '—'}</span>
                </div>
              </div>

              <div className="hub-footer">
                <button
                  onClick={() => handleJoinCall(appt._id)}
                  disabled={joiningId === appt._id || deletingId === appt._id}
                  className={`hub-join-btn ${joiningId === appt._id ? 'loading' : ''}`}
                >
                  {joiningId === appt._id ? 'Preparing Room...' : 'Join Consultation'}
                </button>
                {user?.role === 'patient' && (
                  <button
                    onClick={() => handleDeleteSession(appt._id)}
                    disabled={deletingId === appt._id || joiningId === appt._id}
                    className="hub-delete-btn"
                  >
                    {deletingId === appt._id ? 'Deleting...' : 'Delete Session'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </PatientLayout>
  );
}

const hubStyles = `
  .hub-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 20px;
    margin-top: 20px;
  }

  .hub-card {
    background: white;
    border-radius: 16px;
    padding: 24px;
    border: 1px solid #e4ecf7;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.03);
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .hub-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.05);
  }

  .hub-card-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
  }

  .hub-avatar {
    width: 50px;
    height: 50px;
    border-radius: 12px;
    background: linear-gradient(135deg, #1e3a8a, #3b82f6);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 20px;
  }

  .hub-meta h4 {
    margin: 0;
    font-size: 18px;
    color: #1e293b;
    font-weight: 700;
  }

  .hub-meta span {
    font-size: 14px;
    color: #64748b;
  }

  .hub-details {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 16px 0;
    border-top: 1px solid #f1f5f9;
    border-bottom: 1px solid #f1f5f9;
  }

  .hub-detail-item {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    color: #475569;
  }

  .hub-footer {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .hub-join-btn {
    width: 100%;
    padding: 12px;
    border-radius: 10px;
    border: none;
    background: #2563eb;
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }

  .hub-join-btn:hover:not(:disabled) {
    background: #1d4ed8;
  }

  .hub-join-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .hub-delete-btn {
    width: 100%;
    padding: 11px;
    border-radius: 10px;
    border: 1px solid #fecaca;
    background: #fff1f2;
    color: #be123c;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }

  .hub-delete-btn:hover:not(:disabled) {
    background: #ffe4e6;
  }

  .hub-delete-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .hub-loader-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 100px 0;
    color: #64748b;
  }

  .hub-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f1f5f9;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: hub-spin 1s linear infinite;
    margin-bottom: 16px;
  }

  @keyframes hub-spin {
    to { transform: rotate(360deg); }
  }

  .hub-empty-state {
    text-align: center;
    padding: 100px 20px;
    background: white;
    border-radius: 20px;
    border: 1px dashed #cbd5e1;
  }

  .hub-empty-icon {
    font-size: 60px;
    margin-bottom: 20px;
  }

  .hub-cta-btn {
    margin-top: 20px;
    padding: 10px 24px;
    border-radius: 999px;
    border: none;
    background: #1e293b;
    color: white;
    font-weight: 600;
    cursor: pointer;
  }
`;
