// client/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';

// Public pages
import LandingPage  from './pages/public/LandingPage';
import Login        from './pages/public/Login';
import Register     from './pages/public/Register';
import AppointmentSearch from './pages/public/AppointmentSearch';
import AppointmentResults from './pages/public/AppointmentResults';
import DoctorPublicProfile from './pages/public/DoctorPublicProfile';

import AdminDashboard    from './pages/admin/AdminDashboard';
import AdminDoctors      from './pages/admin/AdminDoctors';
import AdminPatients     from './pages/admin/AdminPatients';

// // Patient pages
import PatientSetup         from './pages/patient/Patientsetupandprofile';
import { PatientProfile }   from './pages/patient/Patientsetupandprofile';
import PatientDashboard     from './pages/patient/PatientDashboard';
import PatientReports       from './pages/patient/Patientreports';
import PatientPrescriptions from './pages/patient/Patientprescriptionsandhistory';
import { PatientHistory }   from './pages/patient/Patientprescriptionsandhistory';
//import PatientAppointments  from './pages/patient/PatientAppointments';


// // Doctor pages
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import Appointments from "./pages/doctor/Appointments";
import Reports from "./pages/doctor/Reports";
import DoctorPrescriptions from "./pages/doctor/DoctorPrescriptions";
import Profile from "./pages/doctor/Profile";
import Availability from "./pages/doctor/Availability";
import VideoServiceTest from './pages/video/VideoServiceTest';

// //Appointment pages
import AddAppointment from './components/appointment/AddAppointment';
import AppointmentDashboard from './components/appointment/AppointmentDashboard';
import ViewAppointment from './components/appointment/ViewAppointment';

// // Admin pages
// import AdminDashboard from './pages/admin/AdminDashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* ── Public ───────────────────────────── */}
          <Route path="/"         element={<LandingPage />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/appointments" element={<AppointmentSearch />} />
          <Route path="/appointments/results" element={<AppointmentResults />} />
          <Route path="/doctors/:doctorId" element={<DoctorPublicProfile />} />

<Route path="/admin/dashboard" element={
  <PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>
} />
<Route path="/admin/doctors" element={
  <PrivateRoute role="admin"><AdminDoctors /></PrivateRoute>
} />
<Route path="/admin/patients" element={
  <PrivateRoute role="admin"><AdminPatients /></PrivateRoute>
} /><Route path="/admin/dashboard" element={
  <PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>
} />
<Route path="/admin/doctors" element={
  <PrivateRoute role="admin"><AdminDoctors /></PrivateRoute>
} />
<Route path="/admin/patients" element={
  <PrivateRoute role="admin"><AdminPatients /></PrivateRoute>
} />

          ── Patient ────────────────────────────
          {/* ── Patient routes ── */}
<Route path="/patient/setup" element={
  <PrivateRoute role="patient"><PatientSetup /></PrivateRoute>
} />

<Route path="/patient/dashboard" element={
  <PrivateRoute role="patient"><PatientDashboard /></PrivateRoute>
} />

<Route path="/patient/profile" element={
  <PrivateRoute role="patient"><PatientProfile /></PrivateRoute>
} />

<Route path="/patient/reports" element={
  <PrivateRoute role="patient"><PatientReports /></PrivateRoute>
} />

<Route path="/patient/prescriptions" element={
  <PrivateRoute role="patient"><PatientPrescriptions /></PrivateRoute>
} />

<Route path="/patient/history" element={
  <PrivateRoute role="patient"><PatientHistory /></PrivateRoute>
} />

{/* <Route path="/patient/appointments" element={
  <PrivateRoute role="patient"><PatientAppointments /></PrivateRoute>
} /> */}

  {/* Doctor ✅ FIXED */}
          <Route path="/doctor/dashboard" element={
            <PrivateRoute role="doctor"><DoctorDashboard /></PrivateRoute>
          } />
          <Route path="/doctor/appointments" element={
            <PrivateRoute role="doctor"><Appointments /></PrivateRoute>
          } />
          <Route path="/doctor/reports" element={
            <PrivateRoute role="doctor"><Reports /></PrivateRoute>
          } />
          <Route path="/doctor/prescriptions" element={
            <PrivateRoute role="doctor"><DoctorPrescriptions /></PrivateRoute>
          } />
          <Route path="/doctor/profile" element={
            <PrivateRoute role="doctor"><Profile /></PrivateRoute>
          } />
          <Route path="/doctor/availability" element={
            <PrivateRoute role="doctor"><Availability /></PrivateRoute>
          } />

          {/* Video Service standalone test page (your part) */}
          <Route path="/video-test" element={<VideoServiceTest />} />


          {/* Appointment routes */}
          <Route path="/patient/appointments" element={
            <PrivateRoute role="patient">
              <AppointmentDashboard />
            </PrivateRoute>
          } />

          <Route path="/patient/add-appointment" element={
            <PrivateRoute role="patient">
              <AddAppointment />
            </PrivateRoute>
          } />

          {/* ── Admin ──────────────────────────────
          <Route path="/admin/dashboard" element={
            <PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>
          }/>

          {/* ── Catch all ────────────────────────── */}
          <Route path="*" element={<Navigate to="/" />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}