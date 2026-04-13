import React from "react";
import { Link } from "react-router-dom";
import PatientLayout from "../../pages/patient/Patientlayout ";

function AppointmentDashboard() {
  return (
    <PatientLayout title="Appointments " subtitle="Manage your medical appointments">
      <div className="flex flex-col gap-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/patient/add-appointment"
            className="p-6 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white hover:shadow-lg transition transform hover:-translate-y-0.5"
          >
            <div className="text-4xl mb-2">+</div>
            <h3 className="font-semibold text-lg">Add Appointment</h3>
            <p className="text-blue-100 text-sm mt-1">Schedule a new appointment</p>
          </Link>

          <Link
            to="/patient/view-appointments"
            className="p-6 rounded-lg bg-gradient-to-br from-teal-600 to-teal-700 text-white hover:shadow-lg transition transform hover:-translate-y-0.5"
          >
            <div className="text-4xl mb-2">"</div>
            <h3 className="font-semibold text-lg">View Appointments</h3>
            <p className="text-teal-100 text-sm mt-1">See your appointment history</p>
          </Link>
        </div>

        {/* Placeholder content */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Your Appointments</h2>
          <p className="text-gray-600">No appointments yet. Click "Add Appointment" to schedule one.</p>
        </div>
      </div>
    </PatientLayout>
  );
}

export default AppointmentDashboard;