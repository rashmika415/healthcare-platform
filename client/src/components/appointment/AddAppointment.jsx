import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3000";

function AddAppointment() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const toInputDate = (value) => {
    if (!value) return "";
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const toInputTime = (value) => {
    if (!value) return "";
    if (typeof value === "string" && /^\d{2}:\d{2}$/.test(value)) return value;
    const str = String(value).trim();
    const twelveHourMatch = str.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
    if (twelveHourMatch) {
      let hour = Number(twelveHourMatch[1]);
      const minute = twelveHourMatch[2];
      const meridiem = twelveHourMatch[3].toUpperCase();
      if (meridiem === "PM" && hour < 12) hour += 12;
      if (meridiem === "AM" && hour === 12) hour = 0;
      return `${String(hour).padStart(2, "0")}:${minute}`;
    }
    const dateParse = new Date(`1970-01-01T${str}`);
    if (!Number.isNaN(dateParse.getTime())) {
      const h = String(dateParse.getHours()).padStart(2, "0");
      const m = String(dateParse.getMinutes()).padStart(2, "0");
      return `${h}:${m}`;
    }
    return "";
  };

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
      notes,
    } = location.state;

    setFormData((prev) => ({
      ...prev,
      doctorId: doctorId || prev.doctorId,
      doctorName: doctorName || prev.doctorName,
      specialization: specialization || prev.specialization,
      date: toInputDate(appointmentDate) || prev.date,
      time: toInputTime(appointmentTime) || prev.time,
      notes: (notes !== undefined && notes !== null && String(notes).trim())
        ? String(notes).trim()
        : prev.notes,
    }));
  }, [location.state]);

  // If book navigation didn't provide a usable date/time, fetch doctor's next available slot.
  useEffect(() => {
    const loadDoctorAvailability = async () => {
      const selectedDoctorId = location.state?.doctorId;
      if (!selectedDoctorId) return;

      const hasDate = Boolean(toInputDate(location.state?.appointmentDate));
      const hasTime = Boolean(toInputTime(location.state?.appointmentTime));
      if (hasDate && hasTime) return;

      try {
        const res = await axios.get(
          `${API_BASE_URL}/doctor/availability/${selectedDoctorId}`
        );
        const activeSlots = (res.data?.availability || []).filter((slot) => slot?.isActive);
        if (activeSlots.length === 0) return;

        const sortedSlots = activeSlots
          .slice()
          .sort((a, b) => {
            const aDate = new Date(a.date).getTime();
            const bDate = new Date(b.date).getTime();
            if (aDate !== bDate) return aDate - bDate;
            return String(a.startTime || "").localeCompare(String(b.startTime || ""));
          });

        const nextSlot = sortedSlots[0];
        setFormData((prev) => ({
          ...prev,
          date: prev.date || toInputDate(nextSlot?.date),
          time: prev.time || toInputTime(nextSlot?.startTime),
        }));
      } catch (error) {
        console.error("Error fetching doctor availability:", error);
      }
    };

    loadDoctorAvailability();
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