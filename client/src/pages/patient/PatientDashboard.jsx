import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { getPatientMedicalHistory, getPatientReports } from '../../services/patientApi';
import { getOrCreateSessionByAppointment, joinSession } from '../../services/videoApi';
import PatientLayout from './Patientlayout ';

export default function PatientDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [reportsCount, setReportsCount] = useState(0);
  const [prescriptionsCount, setPrescriptionsCount] = useState(0);
  const [consultationCount, setConsultationCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [oneTapMessage, setOneTapMessage] = useState('');
  const [joiningCall, setJoiningCall] = useState(false);
  const [inCallAppointmentId, setInCallAppointmentId] = useState('');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardLoadingDoctors, setWizardLoadingDoctors] = useState(false);
  const [wizardLoadingSlots, setWizardLoadingSlots] = useState(false);
  const [wizardSubmitting, setWizardSubmitting] = useState(false);
  const [wizardError, setWizardError] = useState('');
  const [wizardSuccess, setWizardSuccess] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [isCompact, setIsCompact] = useState(window.innerWidth < 980);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currentUser = getStoredUser();
  const patientUserId = String(currentUser?.id || currentUser?._id || currentUser?.userId || '').trim();

  useEffect(() => {
    const handleResize = () => setIsCompact(window.innerWidth < 980);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        const [profileRes, reportsRes, prescriptionsRes, historyRes, appointmentsRes] = await Promise.allSettled([
          api.get('/patients/profile'),
          getPatientReports({ page: 1, limit: 1, status: 'active' }),
          api.get('/patients/prescriptions'),
          getPatientMedicalHistory(),
          patientUserId
            ? api.get(`/appointments/patient/${encodeURIComponent(patientUserId)}`)
            : Promise.resolve({ data: { appointments: [] } })
        ]);

        if (!mounted) return;

        if (profileRes.status !== 'fulfilled') {
          navigate('/patient/setup');
          return;
        }

        setProfile(profileRes.value.data || null);

        if (reportsRes.status === 'fulfilled') {
          setReportsCount(reportsRes.value?.totalReports || reportsRes.value?.reports?.length || 0);
        }

        if (prescriptionsRes.status === 'fulfilled') {
          const prescriptions = prescriptionsRes.value?.data?.prescriptions || [];
          setPrescriptionsCount(prescriptions.length);
        }

        if (historyRes.status === 'fulfilled') {
          const summary = historyRes.value?.summary || {};
          const timeline = historyRes.value?.timeline || [];
          setConsultationCount(summary.appointments || summary.totalEntries || timeline.length || 0);
        }

        if (appointmentsRes.status === 'fulfilled') {
          const appts = Array.isArray(appointmentsRes.value?.data?.appointments)
            ? appointmentsRes.value.data.appointments
            : [];
          setAppointments(appts);
        }
      } catch {
        if (mounted) setError('Failed to load dashboard data.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [navigate, patientUserId]);

  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => String(doctor._id) === String(selectedDoctorId)) || null,
    [doctors, selectedDoctorId]
  );

  const selectedSlot = useMemo(
    () => availabilitySlots.find((slot) => String(slot._id) === String(selectedSlotId)) || null,
    [availabilitySlots, selectedSlotId]
  );

  const activeAppointment = useMemo(() => {
    const sorted = (appointments || [])
      .filter((appt) => !['cancelled', 'completed'].includes(String(appt.status || '').toLowerCase()))
      .sort((a, b) => toAppointmentTime(a) - toAppointmentTime(b));
    return sorted[0] || null;
  }, [appointments]);

  const progressStep = getFlowStep(activeAppointment?.status, Boolean(inCallAppointmentId && activeAppointment?._id === inCallAppointmentId));

  if (loading) return <LoadingScreen />;

  const firstName = profile?.name?.split(' ')[0] || 'Patient';
  const stats = [
    { label: 'Medical Reports', value: reportsCount, note: 'Update 2d ago', link: '/patient/reports', icon: 'RP' },
    { label: 'Prescriptions', value: prescriptionsCount, note: 'Active', link: '/patient/prescriptions', icon: 'RX' },
    { label: 'Consultations', value: consultationCount, note: 'Last: Oct 12', link: '/patient/history', icon: 'CS' }
  ];

  const quickActions = [
    { label: 'Book', hint: 'Start guided booking wizard' },
    { label: 'Upload Report', hint: 'Add a new medical report' },
    { label: 'Join Call', hint: 'Join your next confirmed consultation' },
    { label: 'View Prescription', hint: 'Open your prescriptions quickly' }
  ];

  const filteredActions = quickActions.filter((action) =>
    action.label.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  const handleSearchSubmit = () => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return;

    if (term.includes('book') || term.includes('appoint')) openBookingWizard();
    else if (term.includes('report') || term.includes('record')) navigate('/patient/reports');
    else if (term.includes('prescription') || term.includes('message') || term.includes('medicine')) navigate('/patient/prescriptions');
    else if (term.includes('join') || term.includes('call') || term.includes('video')) handleQuickJoinCall();
    else if (term.includes('history') || term.includes('consult')) navigate('/patient/history');
    else if (term.includes('symptom') || term.includes('checker') || term.includes('ai')) navigate('/patient/symptom-checker');
    else if (term.includes('profile')) navigate('/patient/profile');
  };

  const clearWizard = () => {
    setWizardStep(1);
    setWizardError('');
    setWizardSuccess(null);
    setSelectedDoctorId('');
    setAvailabilitySlots([]);
    setSelectedSlotId('');
    setBookingNotes('');
  };

  const openBookingWizard = async () => {
    clearWizard();
    setWizardOpen(true);
    setWizardLoadingDoctors(true);
    try {
      const res = await api.get('/public/doctors');
      const verifiedDoctors = Array.isArray(res.data?.doctors) ? res.data.doctors : [];
      setDoctors(verifiedDoctors);
      if (!verifiedDoctors.length) {
        setWizardError('No verified doctors are available right now. Please try again shortly.');
      }
    } catch {
      setWizardError('Failed to load doctors for booking wizard.');
      setDoctors([]);
    } finally {
      setWizardLoadingDoctors(false);
    }
  };

  const closeBookingWizard = () => {
    setWizardOpen(false);
    clearWizard();
  };

  const loadDoctorSlots = async () => {
    if (!selectedDoctorId) return;
    setWizardError('');
    setWizardLoadingSlots(true);
    try {
      const res = await api.get(`/doctor/availability/${encodeURIComponent(selectedDoctorId)}`);
      const slots = (res.data?.availability || [])
        .filter((slot) => slot?.isActive)
        .sort((a, b) => toAppointmentTime(a) - toAppointmentTime(b));

      setAvailabilitySlots(slots);
      setSelectedSlotId(slots[0]?._id || '');
      if (!slots.length) {
        setWizardError('Selected doctor has no active slots. Choose another doctor.');
      }
    } catch {
      setWizardError('Failed to load doctor availability.');
      setAvailabilitySlots([]);
      setSelectedSlotId('');
    } finally {
      setWizardLoadingSlots(false);
    }
  };

  const goWizardNext = async () => {
    if (wizardStep === 1) {
      if (!selectedDoctorId) {
        setWizardError('Select a doctor to continue.');
        return;
      }
      await loadDoctorSlots();
      setWizardStep(2);
      return;
    }

    if (wizardStep === 2) {
      if (!selectedSlotId) {
        setWizardError('Select a time slot to continue.');
        return;
      }
      setWizardError('');
      setWizardStep(3);
    }
  };

  const goWizardBack = () => {
    if (wizardStep <= 1) return;
    setWizardError('');
    setWizardStep((step) => step - 1);
  };

  const handleCreateAppointment = async () => {
    if (!selectedDoctor || !selectedSlot) {
      setWizardError('Doctor and slot are required to create an appointment.');
      return;
    }

    if (!patientUserId) {
      setWizardError('Patient session not found. Please login again.');
      return;
    }

    setWizardSubmitting(true);
    setWizardError('');
    try {
      const payload = {
        patientId: patientUserId,
        doctorId: selectedDoctor._id,
        patientName: profile?.name || currentUser?.name || 'Patient',
        patientEmail: profile?.email || currentUser?.email || '',
        doctorName: selectedDoctor.name || '',
        specialization: selectedDoctor.specialization || '',
        date: toDateInput(selectedSlot.date),
        time: selectedSlot.startTime || '',
        notes: bookingNotes.trim()
      };

      const res = await api.post('/appointments/createappointment', payload);
      const created = res.data?.appointment;

      if (!created?._id) {
        setWizardError('Appointment created, but could not read appointment ID for next step.');
        return;
      }

      setAppointments((prev) => [created, ...prev]);
      setWizardSuccess({
        appointmentId: created._id,
        doctorName: created.doctorName || selectedDoctor.name,
        date: created.date || selectedSlot.date,
        time: created.time || selectedSlot.startTime
      });

      setOneTapMessage('Appointment booked successfully. Continue to payment when ready.');
      window.dispatchEvent(new Event('appointments:changed'));
    } catch (err) {
      setWizardError(err.response?.data?.error || 'Failed to create appointment.');
    } finally {
      setWizardSubmitting(false);
    }
  };

  const handleQuickAction = (actionLabel) => {
    setOneTapMessage('');
    if (actionLabel === 'Book') {
      openBookingWizard();
      return;
    }
    if (actionLabel === 'Upload Report') {
      navigate('/patient/reports');
      return;
    }
    if (actionLabel === 'Join Call') {
      handleQuickJoinCall();
      return;
    }
    if (actionLabel === 'View Prescription') {
      navigate('/patient/prescriptions');
    }
  };

  const handleQuickJoinCall = async () => {
    const target = (appointments || [])
      .filter((appt) => ['confirmed', 'accepted', 'in_call', 'in-progress', 'ongoing'].includes(String(appt.status || '').toLowerCase()))
      .sort((a, b) => toAppointmentTime(a) - toAppointmentTime(b))[0];

    if (!target?._id) {
      setOneTapMessage('No confirmed appointment is ready for video call.');
      return;
    }

    setJoiningCall(true);
    try {
      const sessionData = await getOrCreateSessionByAppointment(target._id);
      const joinData = await joinSession(sessionData.session.sessionId, sessionData.join.participantToken);
      const url = joinData.meeting?.url;

      if (!url) {
        setOneTapMessage('Could not open consultation room. Please try from appointments page.');
        return;
      }

      setInCallAppointmentId(target._id);
      window.open(url, '_blank', 'noopener,noreferrer');
      setOneTapMessage('Consultation room opened in a new tab.');
    } catch {
      setOneTapMessage('Failed to join call. Please try again.');
    } finally {
      setJoiningCall(false);
    }
  };

  const dobText = profile?.dateOfBirth
    ? `${new Date(profile.dateOfBirth).toLocaleDateString()} (${getAge(profile.dateOfBirth)} yrs)`
    : 'Not added';

  return (
    <PatientLayout
      title={`Good day, ${firstName}`}
      subtitle="Welcome back to your Nexus Health. Here is your wellness summary."
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onSearchSubmit={handleSearchSubmit}
    >
      <style>{dashboardCss}</style>

      {error && <div style={s.error}>{error}</div>}

      <section style={s.oneTapCard} className="patient-dashboard-one-tap">
        <div style={s.oneTapHead}>
          <div>
            <h3 style={s.oneTapTitle}>One-Tap Patient Flow</h3>
            <p style={s.oneTapSub}>Book, upload reports, join calls, and view prescriptions from one place.</p>
          </div>
          <button
            type="button"
            style={s.wizardBtn}
            className="patient-wizard-btn"
            onClick={openBookingWizard}
          >
            Open Guided Booking
          </button>
        </div>

        <div style={{ ...s.oneTapActions, ...(isCompact ? s.oneTapActionsCompact : {}) }}>
          {quickActions.map((action) => (
            <button
              type="button"
              key={action.label}
              style={s.oneTapActionBtn}
              className="patient-one-tap-action"
              onClick={() => handleQuickAction(action.label)}
              disabled={joiningCall && action.label === 'Join Call'}
            >
              <span style={s.oneTapActionLabel}>{action.label}</span>
              <span style={s.oneTapActionHint}>{action.hint}</span>
            </button>
          ))}
        </div>

        {oneTapMessage && <div style={s.oneTapMessage}>{oneTapMessage}</div>}

        <div style={s.progressCard}>
          <div style={s.progressHead}>
            <div style={s.progressTitle}>Appointment Progress</div>
            <div style={s.progressMeta}>
              {activeAppointment
                ? `Dr. ${activeAppointment.doctorName || 'Pending'} | ${toReadableDate(activeAppointment.date)} ${activeAppointment.time || ''}`
                : 'No active appointment yet'}
            </div>
          </div>

          <div style={s.progressSteps}>
            {['Booked', 'Confirmed', 'In Call', 'Completed'].map((label, index) => (
              <div key={label} style={s.progressStepWrap}>
                <div
                  style={{
                    ...s.progressStepCircle,
                    ...(index <= progressStep ? s.progressStepCircleActive : {})
                  }}
                >
                  {index + 1}
                </div>
                <div style={{ ...s.progressStepLabel, ...(index <= progressStep ? s.progressStepLabelActive : {}) }}>{label}</div>
                {index < 3 && <div style={{ ...s.progressLine, ...(index < progressStep ? s.progressLineActive : {}) }} />}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ ...s.statsRow, ...(isCompact ? s.statsRowCompact : {}) }} className="patient-dashboard-stats">
        {stats.map((st) => (
          <Link to={st.link} key={st.label} style={s.statCard} className="patient-stat-card">
            <div style={s.statTop}>
              <div style={s.statIcon}>{st.icon}</div>
              <div style={s.statNote}>{st.note}</div>
            </div>
            <div style={s.statValue}>{st.value}</div>
            <div style={s.statLabel}>{st.label}</div>
            <div style={s.statMeta}>
              {st.value}{' '}
              {st.label === 'Consultations'
                ? 'Lifetime Visits'
                : st.label === 'Prescriptions'
                  ? 'Current Cycles'
                  : 'Total Documents'}
            </div>
          </Link>
        ))}
      </div>

      <div style={{ ...s.grid, ...(isCompact ? s.gridCompact : {}) }} className="patient-dashboard-grid">
        <section style={s.profileCard} className="patient-dashboard-profile-card">
          <div style={{ ...s.profileTop, ...(isCompact ? s.profileTopCompact : {}) }}>
            <div style={s.avatarCard}>{(profile?.name || 'P').charAt(0).toUpperCase()}</div>
            <div style={s.profileHead}>
              <h3 style={{ ...s.profileName, ...(isCompact ? s.profileNameCompact : {}) }}>{profile?.name || 'Patient Name'}</h3>
              <div style={s.profileLocation}>Mumbai, India</div>
              <div style={s.tagRow}>
                <span style={s.idTag}>PATIENT ID: {profile?._id?.slice(-6)?.toUpperCase() || 'N/A'}</span>
                <span style={s.allergyTag}>ALLERGY: PENICILLIN</span>
              </div>
            </div>
            <Link to="/patient/profile" style={s.editChip}>Edit</Link>
          </div>

          <div style={{ ...s.infoGrid, ...(isCompact ? s.infoGridCompact : {}) }}>
            <InfoItem label="Email Address" value={profile?.email || 'Not added'} />
            <InfoItem label="Phone Number" value={profile?.phone || 'Not added'} />
            <InfoItem label="Blood Group" value={profile?.bloodGroup || 'Not added'} />
            <InfoItem label="Date Of Birth" value={dobText} />
          </div>
        </section>

        <aside>
          <div style={s.quickCard} className="patient-dashboard-quick-card">
            <h4 style={s.quickTitle}>QUICK ACTIONS</h4>
            <div style={s.quickList}>
              {filteredActions.map((action) => (
                <button key={action.label} type="button" onClick={() => handleQuickAction(action.label)} style={s.quickItemBtn} className="patient-quick-item">
                  <span style={s.quickDot}>o</span>
                  <span>{action.label}</span>
                  <span style={s.arrow}>&gt;</span>
                </button>
              ))}
              {filteredActions.length === 0 && <div style={s.emptyQuick}>No quick actions match this search.</div>}
            </div>
          </div>

          <div style={s.emergencyCard}>
            <div style={s.emergencyIcon}>EC</div>
            <div style={s.emergencyTitle}>Emergency Contact</div>
            {profile?.emergencyContact?.name ? (
              <>
                <div style={s.emergencyName}>{profile.emergencyContact.name}</div>
                <div style={s.emergencySub}>{profile.emergencyContact.relationship || 'Primary contact'}</div>
                <div style={s.emergencyPhone}>{profile.emergencyContact.phone || 'No number'}</div>
              </>
            ) : (
              <>
                <div style={s.emergencySub}>No emergency contacts listed. Adding one can help in urgent situations.</div>
                <Link to="/patient/profile" style={s.addContactLink}>ADD CONTACT</Link>
              </>
            )}
          </div>
        </aside>
      </div>

      <section id="resources" style={s.banner} className="patient-dashboard-banner">
        <div style={{ ...s.bannerOverlay, ...(isCompact ? s.bannerOverlayCompact : {}) }} className="patient-dashboard-banner-overlay">
          <div style={{ ...s.bannerTitle, ...(isCompact ? s.bannerTitleCompact : {}) }} className="patient-dashboard-banner-title">Wellness is a journey, not a destination.</div>
          <p style={s.bannerSub}>Explore our curated resources for holistic mental and physical health.</p>
          <Link to="/patient/history" style={s.bannerBtn} className="patient-banner-btn">VIEW RESOURCES</Link>
        </div>
      </section>

      {wizardOpen && (
        <div style={s.wizardOverlay} onClick={closeBookingWizard}>
          <div style={s.wizardModal} onClick={(event) => event.stopPropagation()}>
            <div style={s.wizardModalHead}>
              <div>
                <h3 style={s.wizardTitle}>Guided Appointment Wizard</h3>
                <p style={s.wizardSub}>Step {wizardStep} of 3</p>
              </div>
              <button type="button" style={s.wizardClose} onClick={closeBookingWizard}>X</button>
            </div>

            <div style={s.wizardStepper}>
              {[1, 2, 3].map((step) => (
                <div key={step} style={s.wizardStepItem}>
                  <div style={{ ...s.wizardStepNum, ...(wizardStep >= step ? s.wizardStepNumActive : {}) }}>{step}</div>
                  <div style={{ ...s.wizardStepText, ...(wizardStep >= step ? s.wizardStepTextActive : {}) }}>
                    {step === 1 ? 'Doctor' : step === 2 ? 'Slot' : 'Confirm'}
                  </div>
                </div>
              ))}
            </div>

            {wizardError && <div style={s.wizardError}>{wizardError}</div>}

            {wizardStep === 1 && (
              <div style={s.wizardBody}>
                {wizardLoadingDoctors ? (
                  <div style={s.wizardLoading}>Loading verified doctors...</div>
                ) : (
                  <div style={s.wizardDoctorList}>
                    {(doctors || []).map((doctor) => (
                      <label key={doctor._id} style={s.wizardDoctorItem}>
                        <input
                          type="radio"
                          name="selectedDoctor"
                          checked={selectedDoctorId === doctor._id}
                          onChange={() => {
                            setSelectedDoctorId(doctor._id);
                            setSelectedSlotId('');
                            setAvailabilitySlots([]);
                            setWizardError('');
                          }}
                        />
                        <div>
                          <div style={s.wizardDoctorName}>{doctor.name}</div>
                          <div style={s.wizardDoctorMeta}>{doctor.specialization || 'General'} | {doctor.hospital || 'Hospital not listed'}</div>
                        </div>
                      </label>
                    ))}
                    {!doctors.length && !wizardLoadingDoctors && (
                      <div style={s.wizardLoading}>No verified doctors found.</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {wizardStep === 2 && (
              <div style={s.wizardBody}>
                {wizardLoadingSlots ? (
                  <div style={s.wizardLoading}>Loading available slots...</div>
                ) : (
                  <div style={s.wizardDoctorList}>
                    {(availabilitySlots || []).map((slot) => (
                      <label key={slot._id} style={s.wizardDoctorItem}>
                        <input
                          type="radio"
                          name="selectedSlot"
                          checked={selectedSlotId === slot._id}
                          onChange={() => setSelectedSlotId(slot._id)}
                        />
                        <div>
                          <div style={s.wizardDoctorName}>{toReadableDate(slot.date)} | {slot.startTime} - {slot.endTime}</div>
                          <div style={s.wizardDoctorMeta}>{selectedDoctor?.name || 'Doctor'}</div>
                        </div>
                      </label>
                    ))}
                    {!availabilitySlots.length && !wizardLoadingSlots && (
                      <div style={s.wizardLoading}>No active slots for this doctor.</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {wizardStep === 3 && (
              <div style={s.wizardBody}>
                {!wizardSuccess ? (
                  <>
                    <div style={s.confirmBox}>
                      <div style={s.confirmRow}><strong>Doctor:</strong> Dr. {selectedDoctor?.name || '-'}</div>
                      <div style={s.confirmRow}><strong>Specialization:</strong> {selectedDoctor?.specialization || '-'}</div>
                      <div style={s.confirmRow}><strong>Slot:</strong> {toReadableDate(selectedSlot?.date)} | {selectedSlot?.startTime || '-'} - {selectedSlot?.endTime || '-'}</div>
                    </div>
                    <textarea
                      style={s.wizardNotes}
                      value={bookingNotes}
                      onChange={(event) => setBookingNotes(event.target.value)}
                      placeholder="Add a short reason for consultation (optional)"
                    />
                  </>
                ) : (
                  <div style={s.wizardSuccessBox}>
                    <div style={s.wizardSuccessTitle}>Appointment Booked</div>
                    <div style={s.wizardSuccessText}>Dr. {wizardSuccess.doctorName} | {toReadableDate(wizardSuccess.date)} {wizardSuccess.time || ''}</div>
                    <button
                      type="button"
                      style={s.wizardBtn}
                      onClick={() => navigate('/payment', { state: { appointmentId: wizardSuccess.appointmentId } })}
                    >
                      Continue to Payment
                    </button>
                  </div>
                )}
              </div>
            )}

            <div style={s.wizardActions}>
              <button type="button" style={s.wizardGhostBtn} onClick={wizardStep === 1 ? closeBookingWizard : goWizardBack}>
                {wizardStep === 1 ? 'Cancel' : 'Back'}
              </button>

              {!wizardSuccess && wizardStep < 3 && (
                <button type="button" style={s.wizardBtn} onClick={goWizardNext}>Next</button>
              )}

              {!wizardSuccess && wizardStep === 3 && (
                <button type="button" style={s.wizardBtn} onClick={handleCreateAppointment} disabled={wizardSubmitting}>
                  {wizardSubmitting ? 'Booking...' : 'Book Appointment'}
                </button>
              )}

              {wizardSuccess && (
                <button type="button" style={s.wizardBtn} onClick={closeBookingWizard}>Done</button>
              )}
            </div>
          </div>
        </div>
      )}
    </PatientLayout>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <div style={s.infoLabel}>{label}</div>
      <div style={s.infoValue}>{value}</div>
    </div>
  );
}

function getAge(dateValue) {
  const dob = new Date(dateValue);
  if (Number.isNaN(dob.getTime())) return '-';

  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }

  return age;
}

function getStoredUser() {
  try {
    const persistence = localStorage.getItem('authPersistence');
    if (persistence === 'local') {
      return JSON.parse(localStorage.getItem('user') || 'null');
    }
    return (
      JSON.parse(sessionStorage.getItem('user') || 'null')
      || JSON.parse(localStorage.getItem('user') || 'null')
    );
  } catch {
    return null;
  }
}

function toDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toReadableDate(value) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString();
}

function toAppointmentTime(appointment) {
  const datePart = toDateInput(appointment?.date);
  const timePart = String(appointment?.time || appointment?.startTime || '00:00').trim();
  if (!datePart) return Number.MAX_SAFE_INTEGER;
  const date = new Date(`${datePart}T${timePart.length === 5 ? timePart : '00:00'}`);
  return Number.isNaN(date.getTime()) ? Number.MAX_SAFE_INTEGER : date.getTime();
}

function getFlowStep(status, isInCallNow) {
  if (isInCallNow) return 2;
  const value = String(status || '').toLowerCase();
  if (['completed'].includes(value)) return 3;
  if (['in_call', 'in-call', 'inprogress', 'in-progress', 'ongoing'].includes(value)) return 2;
  if (['confirmed', 'accepted'].includes(value)) return 1;
  if (['pending', 'booked', 'scheduled', 'paid'].includes(value)) return 0;
  return 0;
}

const s = {
  error: { background: '#fff1f1', color: '#b73f3f', border: '1px solid #eec9c9', borderRadius: 11, padding: '10px 12px', marginBottom: 12, fontSize: 13 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16, marginBottom: 18 },
  statsRowCompact: { gridTemplateColumns: '1fr' },
  statCard: { textDecoration: 'none', background: 'linear-gradient(180deg, #ffffff 0%, #f2f8ff 100%)', border: '1px solid #d7e5f3', borderRadius: 14, padding: 16, color: '#2a4458', boxShadow: '0 10px 26px rgba(3, 40, 88, 0.08)' },
  statTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  statIcon: { width: 40, height: 40, borderRadius: 10, background: '#ebf3fc', border: '1px solid #d0dff0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e4f75' },
  statNote: { fontSize: 10, color: '#567997', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700 },
  statValue: { fontSize: 44, lineHeight: 1, marginBottom: 8, fontFamily: "'Sora', sans-serif", fontWeight: 500, color: '#0f3150' },
  statLabel: { fontSize: 14, marginBottom: 3, color: '#2b5474', fontWeight: 700, letterSpacing: 0.2 },
  statMeta: { fontSize: 13, color: '#5f7383' },
  grid: { display: 'grid', gridTemplateColumns: '2fr 1.35fr', gap: 18, alignItems: 'start' },
  gridCompact: { gridTemplateColumns: '1fr' },
  profileCard: { background: 'linear-gradient(180deg, #ffffff 0%, #f6faff 100%)', border: '1px solid #d7e5f3', borderRadius: 14, padding: 18, boxShadow: '0 10px 26px rgba(3, 40, 88, 0.06)' },
  profileTop: { display: 'grid', gridTemplateColumns: '90px 1fr auto', gap: 14, alignItems: 'center', marginBottom: 20 },
  profileTopCompact: { gridTemplateColumns: '1fr', justifyItems: 'start' },
  avatarCard: { width: 90, height: 90, borderRadius: 12, background: 'linear-gradient(145deg, #001836, #0e4b83)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#eef7ff', fontSize: 36, fontWeight: 700, boxShadow: '0 10px 24px rgba(2, 46, 92, 0.28)' },
  profileHead: { minWidth: 0 },
  profileName: { margin: 0, fontSize: 42, lineHeight: 1.05, color: '#123855', fontFamily: "'Sora', sans-serif", fontWeight: 500 },
  profileNameCompact: { fontSize: 30 },
  profileLocation: { marginTop: 8, color: '#627f95', fontSize: 14 },
  tagRow: { marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' },
  idTag: { padding: '3px 8px', borderRadius: 999, fontSize: 10, color: '#245172', background: '#e6f1fb', fontWeight: 700, letterSpacing: 0.5, border: '1px solid #c8def2' },
  allergyTag: { padding: '3px 8px', borderRadius: 999, fontSize: 10, color: '#9f4141', background: '#fbe4e4', fontWeight: 700, letterSpacing: 0.5, border: '1px solid #f2c9c9' },
  editChip: { border: '1px solid #cfe0f1', borderRadius: 8, padding: '8px 12px', textDecoration: 'none', color: '#2f5778', background: '#f3f8ff', fontSize: 12, fontWeight: 700 },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px 24px' },
  infoGridCompact: { gridTemplateColumns: '1fr' },
  infoLabel: { fontSize: 10, letterSpacing: 1.2, color: '#7390a7', textTransform: 'uppercase', marginBottom: 5, fontWeight: 700 },
  infoValue: { fontSize: 25, lineHeight: 1.2, color: '#163e5d', fontFamily: "'Sora', sans-serif", fontWeight: 400 },
  quickCard: { background: 'linear-gradient(180deg, #ffffff 0%, #f6faff 100%)', border: '1px solid #d7e5f3', borderRadius: 14, padding: 14, boxShadow: '0 10px 26px rgba(3, 40, 88, 0.06)' },
  quickTitle: { margin: '0 0 10px', fontSize: 11, color: '#597792', letterSpacing: 1.2 },
  quickList: { display: 'flex', flexDirection: 'column', gap: 8 },
  quickItemBtn: { width: '100%', textAlign: 'left', cursor: 'pointer', textDecoration: 'none', padding: '10px 12px', borderRadius: 9, border: '1px solid #d3e2f1', background: '#f8fbff', color: '#224e70', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 },
  quickDot: { color: '#3a6688' },
  arrow: { marginLeft: 'auto', color: '#5f7d96' },
  emptyQuick: { borderRadius: 7, border: '1px dashed #ccdced', color: '#6f88a0', fontSize: 12, padding: '10px 12px', background: '#f5f9fd' },
  emergencyCard: { marginTop: 16, background: 'linear-gradient(180deg, #ffffff 0%, #f6faff 100%)', border: '1px dashed #c8daec', borderRadius: 14, padding: '24px 16px', textAlign: 'center', boxShadow: '0 10px 26px rgba(3, 40, 88, 0.06)' },
  emergencyIcon: { width: 44, height: 44, margin: '0 auto', borderRadius: 12, background: '#e8f2fc', color: '#376286', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  emergencyTitle: { marginTop: 14, color: '#34556b', fontWeight: 700, fontSize: 15 },
  emergencyName: { marginTop: 8, color: '#2b4a5f', fontWeight: 700, fontSize: 14 },
  emergencySub: { marginTop: 6, color: '#628297', fontSize: 12, lineHeight: 1.45 },
  emergencyPhone: { marginTop: 6, color: '#34556b', fontWeight: 700, fontSize: 13 },
  addContactLink: { marginTop: 12, display: 'inline-block', color: '#245373', fontSize: 12, fontWeight: 700, letterSpacing: 0.7, textDecoration: 'none' },
  banner: { marginTop: 16, position: 'relative', borderRadius: 12, overflow: 'hidden', minHeight: 210, border: '1px solid #c2d5e8', background: 'linear-gradient(120deg, #001836 0%, #003566 52%, #0e7490 100%)', boxShadow: '0 16px 36px rgba(3, 32, 66, 0.22)' },
  bannerImage: { width: '100%', height: '100%', minHeight: 210, objectFit: 'cover', display: 'block' },
  bannerOverlay: { position: 'absolute', inset: 0, background: 'radial-gradient(circle at 85% 10%, rgba(125, 211, 252, 0.3), transparent 36%), linear-gradient(90deg, rgba(6, 23, 43, 0.9) 0%, rgba(6, 23, 43, 0.56) 48%, rgba(6, 23, 43, 0.08) 100%)', color: '#f3f6fb', padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: '62%' },
  bannerOverlayCompact: { maxWidth: '100%', background: 'linear-gradient(180deg, rgba(6, 23, 43, 0.74) 0%, rgba(6, 23, 43, 0.72) 100%)' },
  bannerTitle: { fontSize: 42, lineHeight: 1.05, fontFamily: "'Sora', sans-serif", marginBottom: 10 },
  bannerTitleCompact: { fontSize: 30 },
  bannerSub: { margin: 0, color: '#d8e8f7', fontSize: 13 },
  bannerBtn: { marginTop: 20, alignSelf: 'flex-start', padding: '9px 14px', border: '1px solid #a8c4e1', color: '#edf5ff', textDecoration: 'none', borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: 0.8, background: 'rgba(13, 37, 61, 0.35)' },
  oneTapCard: { background: 'linear-gradient(180deg, #ffffff 0%, #f7fbff 100%)', border: '1px solid #d7e5f3', borderRadius: 14, padding: 16, marginBottom: 16, boxShadow: '0 10px 26px rgba(3, 40, 88, 0.06)' },
  oneTapHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' },
  oneTapTitle: { margin: 0, fontSize: 19, color: '#133e60', fontWeight: 700 },
  oneTapSub: { margin: '4px 0 0', fontSize: 13, color: '#5f7f97' },
  oneTapActions: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 },
  oneTapActionsCompact: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
  oneTapActionBtn: { textAlign: 'left', border: '1px solid #cfe0f2', background: '#ffffff', borderRadius: 11, padding: '12px 10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4 },
  oneTapActionLabel: { fontSize: 14, fontWeight: 700, color: '#1f4f72' },
  oneTapActionHint: { fontSize: 11, color: '#6887a0' },
  oneTapMessage: { marginTop: 10, borderRadius: 9, border: '1px solid #cfe2f5', background: '#edf6ff', color: '#224d6f', padding: '8px 10px', fontSize: 12 },
  progressCard: { marginTop: 14, borderRadius: 12, border: '1px solid #d8e6f4', background: '#f8fbff', padding: 12 },
  progressHead: { marginBottom: 10 },
  progressTitle: { fontSize: 13, fontWeight: 700, color: '#204d6f' },
  progressMeta: { fontSize: 12, color: '#67849c', marginTop: 4 },
  progressSteps: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 6, alignItems: 'center' },
  progressStepWrap: { position: 'relative', display: 'flex', alignItems: 'center', gap: 8, minHeight: 28 },
  progressStepCircle: { width: 24, height: 24, borderRadius: 999, border: '1px solid #c8d9ea', background: '#fff', color: '#5f7f96', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, zIndex: 2 },
  progressStepCircleActive: { background: '#1f5c8a', border: '1px solid #1f5c8a', color: '#fff' },
  progressStepLabel: { fontSize: 11, color: '#6d8aa1', fontWeight: 600 },
  progressStepLabelActive: { color: '#1f5c8a' },
  progressLine: { position: 'absolute', top: '50%', right: '-10px', width: 22, height: 2, background: '#d7e5f3', zIndex: 1 },
  progressLineActive: { background: '#1f5c8a' },
  wizardBtn: { border: '1px solid #b8d2ea', borderRadius: 10, padding: '8px 12px', background: '#1f5c8a', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  wizardGhostBtn: { border: '1px solid #c7dced', borderRadius: 10, padding: '8px 12px', background: '#f6fbff', color: '#2f5778', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  wizardOverlay: { position: 'fixed', inset: 0, background: 'rgba(7, 22, 39, 0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 },
  wizardModal: { width: '100%', maxWidth: 760, maxHeight: '92vh', overflow: 'auto', background: '#fff', borderRadius: 14, border: '1px solid #d7e5f3', boxShadow: '0 22px 56px rgba(6, 26, 48, 0.34)', padding: 16 },
  wizardModalHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 },
  wizardTitle: { margin: 0, fontSize: 20, color: '#143e60' },
  wizardSub: { margin: '4px 0 0', fontSize: 12, color: '#6888a0' },
  wizardClose: { border: '1px solid #d1e1f0', borderRadius: 8, background: '#f7fbff', padding: '6px 8px', cursor: 'pointer', color: '#375d7a' },
  wizardStepper: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginBottom: 12 },
  wizardStepItem: { display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #d8e6f3', borderRadius: 10, padding: '8px 10px', background: '#fbfdff' },
  wizardStepNum: { width: 24, height: 24, borderRadius: 999, border: '1px solid #c8daea', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6a8ba4', fontSize: 11, fontWeight: 700 },
  wizardStepNumActive: { background: '#1f5c8a', border: '1px solid #1f5c8a', color: '#fff' },
  wizardStepText: { fontSize: 12, color: '#6f8ba1', fontWeight: 700 },
  wizardStepTextActive: { color: '#1f5c8a' },
  wizardBody: { border: '1px solid #d9e7f3', borderRadius: 11, padding: 12, background: '#fcfeff', minHeight: 210 },
  wizardDoctorList: { display: 'flex', flexDirection: 'column', gap: 8 },
  wizardDoctorItem: { display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #d5e4f3', borderRadius: 10, padding: '9px 10px', background: '#fff', cursor: 'pointer' },
  wizardDoctorName: { fontSize: 13, color: '#1f4e72', fontWeight: 700 },
  wizardDoctorMeta: { marginTop: 2, fontSize: 11, color: '#6a8ba5' },
  wizardLoading: { padding: '18px 12px', textAlign: 'center', color: '#64859d', fontSize: 13 },
  wizardError: { borderRadius: 9, border: '1px solid #efc5c5', background: '#fff0f0', color: '#ab3f3f', padding: '8px 10px', fontSize: 12, marginBottom: 10 },
  wizardActions: { marginTop: 12, display: 'flex', justifyContent: 'space-between', gap: 8 },
  wizardNotes: { marginTop: 10, width: '100%', minHeight: 95, border: '1px solid #d2e2f1', borderRadius: 10, padding: 10, fontSize: 13, color: '#254e70' },
  confirmBox: { border: '1px solid #d6e5f3', borderRadius: 10, padding: 10, background: '#f8fcff' },
  confirmRow: { fontSize: 13, color: '#285277', marginBottom: 6 },
  wizardSuccessBox: { border: '1px solid #cfe5d2', borderRadius: 10, background: '#f1fcf3', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 },
  wizardSuccessTitle: { fontSize: 15, fontWeight: 700, color: '#1e6b35' },
  wizardSuccessText: { fontSize: 13, color: '#285277' }
};

const dashboardCss = `
.patient-stat-card,
.patient-quick-item,
.patient-banner-btn {
  transition: transform 0.16s ease, box-shadow 0.2s ease, border-color 0.18s ease, background-color 0.18s ease;
}
.patient-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 34px rgba(3, 40, 88, 0.16);
  border-color: #b9d2ea;
}
.patient-quick-item:hover {
  transform: translateX(2px);
  border-color: #bfd6ec;
  background: #f2f8ff;
}
.patient-one-tap-action,
.patient-wizard-btn {
  transition: transform 0.16s ease, box-shadow 0.2s ease, border-color 0.18s ease;
}
.patient-one-tap-action:hover,
.patient-wizard-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(3, 40, 88, 0.13);
}
.patient-banner-btn:hover {
  transform: translateY(-1px);
  background: rgba(13, 37, 61, 0.52);
  border-color: #bdd3e8;
}
@media (prefers-reduced-motion: reduce) {
  .patient-stat-card,
  .patient-quick-item,
  .patient-banner-btn {
    transition: none !important;
  }
}
@media (max-width: 900px) {
  .patient-dashboard-stats {
    gap: 12px !important;
  }
  .patient-dashboard-grid {
    gap: 14px !important;
  }
  .patient-dashboard-one-tap .patient-one-tap-action {
    min-height: 72px;
  }
}
@media (max-width: 760px) {
  .patient-dashboard-profile-card {
    padding: 14px !important;
  }
  .patient-dashboard-quick-card {
    padding: 12px !important;
  }
  .patient-dashboard-banner {
    min-height: 180px !important;
  }
  .patient-dashboard-banner-overlay {
    padding: 18px !important;
  }
  .patient-dashboard-banner-title {
    font-size: 24px !important;
    line-height: 1.1 !important;
    margin-bottom: 8px !important;
  }
  .patient-dashboard-one-tap .patient-one-tap-action {
    min-height: 66px;
  }
  .patient-dashboard-one-tap {
    padding: 12px !important;
  }
  .patient-dashboard-one-tap .patient-wizard-btn {
    width: 100%;
  }
}
`;

function LoadingScreen() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: "'Manrope', sans-serif", color: '#607586', fontSize: 15 }}>
      Loading your dashboard...
    </div>
  );
}
