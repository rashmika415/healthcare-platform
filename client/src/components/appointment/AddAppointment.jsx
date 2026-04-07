import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

function AddAppointment() {
  const { user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    patientId: "",
    doctorId: "",
    patientName: "",
    doctorName: "",
    specialization: "",
    date: "",
    time: "",
    notes: "",
  });

  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [doctorError, setDoctorError] = useState(null);

  const handleDoctorChange = (e) => {
    const selectedDoctor = doctors.find((doc) => doc._id === e.target.value);

    if (selectedDoctor) {
      setFormData((prev) => ({
        ...prev,
        doctorId: selectedDoctor._id,
        doctorName: selectedDoctor.name,
        specialization: selectedDoctor.specialization,
      }));
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setFormData((prev) => ({ ...prev, patientId: "", patientName: "" }));
      return;
    }

    const patientId = String(user.id ?? user._id ?? user.userId ?? "");
    setFormData((prev) => ({
      ...prev,
      patientId,
      patientName: user.name || "",
    }));
  }, [user, authLoading]);

  useEffect(() => {
    const normalizeDoctorList = (data) => {
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.doctors)) return data.doctors;
      return [];
    };

    const axiosErrorMessage = (error) => {
      const d = error.response?.data;
      if (d && typeof d === "object" && (d.error || d.message)) {
        return d.error || d.message;
      }
      if (typeof d === "string" && d.trim()) return d.slice(0, 200);
      if (error.response?.status) {
        return `Request failed (${error.response.status}). Is the appointment or doctor service running?`;
      }
      if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
        return "Network error — check that appointment (3003) and doctor (3002) services are running.";
      }
      return error.message || "Failed to load doctors.";
    };

    const fetchDoctors = async () => {
      try {
        setLoadingDoctors(true);
        setDoctorError(null);

        const appointmentBase = (
          process.env.REACT_APP_APPOINTMENT_URL || "http://localhost:3003"
        ).replace(/\/$/, "");
        const doctorBase = (
          process.env.REACT_APP_DOCTOR_SERVICE_URL || "http://localhost:3002"
        ).replace(/\/$/, "");

        const urls = [
          `${appointmentBase}/appointments/verified-doctors`,
          `${doctorBase}/doctors-list`,
        ];

        let lastError = null;
        for (const url of urls) {
          try {
            const res = await axios.get(url, { timeout: 15000 });
            const list = normalizeDoctorList(res.data);

            if (list.length > 0) {
              setDoctors(list);
              return;
            }

            setDoctors([]);
            if (!Array.isArray(res.data) && !res.data?.doctors) {
              setDoctorError("No doctors available");
            }
            return;
          } catch (err) {
            lastError = err;
            console.warn(`Doctors fetch failed (${url}):`, err.message);
          }
        }

        setDoctors([]);
        setDoctorError(axiosErrorMessage(lastError));
      } finally {
        setLoadingDoctors(false);
      }
    };

    fetchDoctors();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        "http://localhost:3003/appointments/createappointment",
        formData
      );

      alert("✅ Appointment Added Successfully!");

      const patientId = user
        ? String(user.id ?? user._id ?? user.userId ?? "")
        : "";

      setFormData({
        patientId,
        doctorId: "",
        patientName: user?.name || "",
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
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Add Appointment
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Schedule your consultation by selecting a verified doctor, date, and
            preferred time.
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Patient Info */}
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Patient ID
                </label>
                <input
                  type="text"
                  name="patientId"
                  value={formData.patientId}
                  readOnly
                  required
                  className="w-full rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Patient Name
                </label>
                <input
                  type="text"
                  name="patientName"
                  value={formData.patientName}
                  readOnly
                  required
                  className="w-full rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-slate-800 outline-none"
                />
              </div>
            </div>

            {/* Doctor Selection */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Select Doctor
              </label>
              <select
                name="doctorId"
                value={formData.doctorId}
                onChange={handleDoctorChange}
                required
                disabled={loadingDoctors || doctors.length === 0}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
              >
                <option value="">
                  {loadingDoctors ? "Loading doctors..." : "Select Doctor"}
                </option>
                {doctorError && <option disabled>Error: {doctorError}</option>}
                {doctors.map((doc) => (
                  <option key={doc._id} value={doc._id}>
                    {doc.name} - {doc.specialization}
                  </option>
                ))}
              </select>

              {doctorError && (
                <p className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  ⚠️ {doctorError}
                </p>
              )}

              {!loadingDoctors && doctors.length === 0 && !doctorError && (
                <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  ℹ️ No verified doctors available at the moment.
                </p>
              )}
            </div>

            {/* Doctor Details */}
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Doctor Name
                </label>
                <input
                  type="text"
                  name="doctorName"
                  value={formData.doctorName}
                  readOnly
                  className="w-full rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Specialization
                </label>
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization}
                  readOnly
                  className="w-full rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-slate-800 outline-none"
                />
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Appointment Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Appointment Time
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Notes
              </label>
              <textarea
                name="notes"
                placeholder="Add any symptoms or extra details (optional)"
                value={formData.notes}
                onChange={handleChange}
                rows="4"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:from-blue-700 hover:to-sky-600 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-200"
              >
                Add Appointment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddAppointment;