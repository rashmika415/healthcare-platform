// client/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';

// Public pages
import LandingPage  from './pages/public/LandingPage';
import Login        from './pages/public/Login';
import Register     from './pages/public/Register';

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