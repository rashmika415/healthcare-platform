import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3000";

function AddAppointment() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    patientId: "",
    doctorId: "",
    patientName: "",
    patientEmail: "", 
    doctorName: "",
    specialization: "",
    date: "",
    time: "",
    notes: "",
  });

  const location = useLocation();

  // ✅ Load patient info
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setFormData((prev) => ({
        ...prev,
        patientId: "",
        patientName: "",
        patientEmail: "",
      }));
      return;
    }

    const patientId = String(user.id ?? user._id ?? user.userId ?? "");

    setFormData((prev) => ({
      ...prev,
      patientId,
      patientName: user.name || "",
      patientEmail: user.email || "",
    }));
  }, [user, authLoading]);

  // ✅ Load doctor info from navigation state
  useEffect(() => {
    if (!location.state) return;

    const {
      doctorId,
      doctorName,
      specialization,
      appointmentDate,
      appointmentTime,
    } = location.state;

    setFormData((prev) => ({
      ...prev,
      doctorId: doctorId || prev.doctorId,
      doctorName: doctorName || prev.doctorName,
      specialization: specialization || prev.specialization,
      date: appointmentDate || prev.date,
      time: appointmentTime || prev.time,
    }));
  }, [location.state]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ✅ CREATE APPOINTMENT + GO TO PAYMENT
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        `${API_BASE_URL}/appointments/createappointment`,
        formData
      );

      const appointmentId = res.data?.appointment?._id;
      if (!appointmentId) {
        console.error("Appointment created but response is missing appointmentId:", res.data);
        alert("✅ Appointment added, but payment navigation failed. Please try again.");
        return;
      }

      alert("✅ Appointment Added Successfully!");

      // Let other tabs/pages (doctor dashboard) refresh their appointment lists.
      try {
        window.dispatchEvent(new Event("appointments:changed"));
      } catch {}

      // 🔥 GO TO PAYMENT PAGE
      navigate("/payment", {
        state: {
          appointmentId,
        },
      });

      // reset form
      const patientId = user
        ? String(user.id ?? user._id ?? user.userId ?? "")
        : "";

      setFormData({
        patientId,
        doctorId: "",
        patientName: user?.name || "",
        patientEmail: user?.email || "",
        doctorName: "",
        specialization: "",
        date: "",
        time: "",
        notes: "",
      });
    } catch (error) {
      console.error("Error adding appointment:", error);
      alert("❌ Failed to add appointment");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50 px-4 py-8">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="mb-8 rounded-3xl border border-blue-100 bg-white/90 p-6 shadow-sm backdrop-blur">
          <h2 className="text-3xl font-bold text-slate-900">
            Add Appointment
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Schedule your consultation by selecting a verified doctor, date, and time.
          </p>
        </div>

        {/* Form */}
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Patient */}
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold">Patient ID</label>
                <input
                  type="text"
                  name="patientId"
                  value={formData.patientId}
                  readOnly
                  className="w-full bg-blue-50 p-3 rounded-xl"
                />
              </div>

              <div>
                <label className="text-sm font-semibold">Patient Name</label>
                <input
                  type="text"
                  name="patientName"
                  value={formData.patientName}
                  readOnly
                  className="w-full bg-blue-50 p-3 rounded-xl"
                />
              </div>
            </div>
            <div>
          <label className="text-sm font-semibold">Email</label>
          <input
            type="email"
            name="patientEmail"
            value={formData.patientEmail}
            readOnly
            className="w-full bg-blue-50 p-3 rounded-xl"
          />
        </div>

            {/* Doctor */}
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold">Doctor Name</label>
                <input
                  type="text"
                  name="doctorName"
                  value={formData.doctorName}
                  readOnly
                  className="w-full bg-blue-50 p-3 rounded-xl"
                />
              </div>

              <div>
                <label className="text-sm font-semibold">Specialization</label>
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization}
                  readOnly
                  className="w-full bg-blue-50 p-3 rounded-xl"
                />
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid gap-5 md:grid-cols-2">
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="p-3 rounded-xl border"
              />

              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                required
                className="p-3 rounded-xl border"
              />
            </div>

            {/* Notes */}
            <textarea
              name="notes"
              placeholder="Notes (optional)"
              value={formData.notes}
              onChange={handleChange}
              rows="4"
              className="w-full p-3 rounded-xl border"
            />

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-sky-500 text-white py-3 rounded-xl font-semibold"
            >
              Add Appointment
            </button>

          </form>
        </div>

      </div>
    </div>
  );
}

export default AddAppointment;