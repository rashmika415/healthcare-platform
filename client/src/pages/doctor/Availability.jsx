import { useState, useEffect } from "react";
import api from "../../services/api";
import Sidebar from "../../components/doctor/Sidebar";
import Topbar from "../../components/doctor/Topbar";
import { Clock, Plus, Trash2, CheckCircle, XCircle, Calendar } from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const DAY_COLORS = {
  Monday:    { bg: "bg-blue-50",   text: "text-blue-600",   dot: "bg-blue-500"   },
  Tuesday:   { bg: "bg-purple-50", text: "text-purple-600", dot: "bg-purple-500" },
  Wednesday: { bg: "bg-green-50",  text: "text-green-600",  dot: "bg-green-500"  },
  Thursday:  { bg: "bg-orange-50", text: "text-orange-600", dot: "bg-orange-500" },
  Friday:    { bg: "bg-pink-50",   text: "text-pink-600",   dot: "bg-pink-500"   },
  Saturday:  { bg: "bg-yellow-50", text: "text-yellow-600", dot: "bg-yellow-500" },
  Sunday:    { bg: "bg-red-50",    text: "text-red-600",    dot: "bg-red-500"    },
};

export default function DoctorAvailability() {
  const [doctor, setDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [summary, setSummary] = useState({ totalSlots: 0, activeSlots: 0, inactiveSlots: 0 });
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [selectedDay, setSelectedDay] = useState("All");

  const [form, setForm] = useState({ day: "Monday", startTime: "", endTime: "" });

  // Fetch availability
  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      setApiError(null);

      const res = await api.get("/doctor/availability/me");
      console.log("[Availability] GET /doctor/availability/me response:", res.data);

      setDoctor(res.data.doctor || null);

      const rawAvailability = res.data.availability || [];
      const normalizedAvailability = Array.isArray(rawAvailability)
        ? rawAvailability
        : rawAvailability ? [rawAvailability] : [];

      setSlots(normalizedAvailability);
      setSummary(res.data.summary || { totalSlots: normalizedAvailability.length, activeSlots: normalizedAvailability.filter(s => s.isActive).length, inactiveSlots: normalizedAvailability.filter(s => !s.isActive).length });
    } catch (err) {
      console.error("[Availability] fetch error", err);
      if (err.response?.status === 404 && err.response?.data?.error?.toLowerCase().includes("profile")) {
        setApiError("Doctor profile not found: create your doctor profile first.");
      } else if (err.response) {
        setApiError(err.response.data?.error || "Failed to load availability data.");
      } else {
        setApiError("Unable to connect to server.");
      }

      setDoctor(null);
      setSlots([]);
      setSummary({ totalSlots: 0, activeSlots: 0, inactiveSlots: 0 });
    } finally {
      setLoading(false);
    }
  };

const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

 
  const handleAdd = async (e) => {
    if (e) e.preventDefault(); // 🔥 prevent refresh

    if (!form.startTime || !form.endTime) {
      showMessage("error", "Please fill start and end time.");
      return;
    }
    try {
      setAdding(true);
      await api.post("/doctor/availability", form);
      showMessage("success", "Slot added successfully!");
      setForm({ day: "Monday", startTime: "", endTime: "" });
      fetchSlots();
    } catch (err) {
      showMessage("error", err.response?.data?.error || "Failed to add slot.");
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (slot) => {
    try {
      await api.patch(`/doctor/availability/${slot._id}`, {
        day: slot.day,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isActive: !slot.isActive,
      });
      fetchSlots();
    } catch (err) {
      showMessage("error", "Failed to update slot.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this slot?")) return;
    try {
      await api.delete(`/doctor/availability/${id}`);
      showMessage("success", "Slot deleted.");
      fetchSlots();
    } catch (err) {
      showMessage("error", "Failed to delete slot.");
    }
  };

  // Group slots by day
  const grouped = DAYS.reduce((acc, day) => {
    acc[day] = slots.filter((s) => s.day === day);
    return acc;
  }, {});

  const filteredDays = selectedDay === "All" ? DAYS : [selectedDay];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 p-6 overflow-auto">
        <Topbar />

        {doctor && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-500">Doctor Profile</p>
              <p className="text-xl font-bold text-gray-800">{doctor.name || "Doctor"}</p>
              <p className="text-sm text-gray-500">{doctor.specialization || "No specialization set"}</p>
              <p className="text-xs text-gray-400 mt-1">{doctor.hospital || "Hospital not set"}</p>
              {doctor.bio && <p className="text-xs text-gray-400 mt-1">{doctor.bio}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Verified</p>
              <p className={`text-sm font-semibold ${doctor.isVerified ? "text-green-600" : "text-yellow-600"}`}>
                {doctor.isVerified ? "Yes" : "No"}
              </p>
            </div>
          </div>
        )}

        {/* API Error Message */}
        {apiError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 border border-red-100">
            {apiError}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total Slots", value: summary.totalSlots || 0, color: "blue",   icon: Calendar    },
            { label: "Active Slots", value: summary.activeSlots || 0, color: "green", icon: CheckCircle },
            { label: "Inactive Slots", value: summary.inactiveSlots || 0, color: "red", icon: XCircle  },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${color}-50`}>
                <Icon size={18} className={`text-${color}-500`} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">{label}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* Add Slot Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                <Plus size={16} className="text-blue-600" />
              </div>
              <h2 className="font-bold text-gray-800">Add New Slot</h2>
            </div>

            {message && (
              <div className={`mb-4 px-4 py-2.5 rounded-xl text-xs font-medium ${
                message.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-600 border border-red-200"
              }`}>
                {message.text}
              </div>
            )}

            {/* Day Selector */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-500 mb-2 block">Day</label>
              <div className="grid grid-cols-2 gap-2">
                {DAYS.map((day) => {
                  const c = DAY_COLORS[day];
                  const active = form.day === day;
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setForm({ ...form, day })}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border
                        ${active
                          ? `${c.bg} ${c.text} border-current shadow-sm`
                          : "bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100"
                        }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Inputs */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-500 mb-1 block flex items-center gap-1">
                <Clock size={11} /> Start Time
              </label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-500 mb-1 block flex items-center gap-1">
                <Clock size={11} /> End Time
              </label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
            type="button"
              onClick={handleAdd}
              disabled={adding}
              className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <Plus size={15} />
              {adding ? "Adding..." : "Add Slot"}
            </button>
          </div>

          {/* Slots List */}
          <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-800">My Schedule</h2>

              {/* Day Filter */}
              <div className="flex gap-1.5 flex-wrap">
                {["All", ...DAYS.map((d) => d.slice(0, 3))].map((label, i) => {
                  const fullDay = i === 0 ? "All" : DAYS[i - 1];
                  const active = selectedDay === fullDay;
                  return (
                    <button
                      key={label}
                      onClick={() => setSelectedDay(fullDay)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all
                        ${active
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                        }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                Loading schedule...
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDays.map((day) => {
                  const daySlots = grouped[day];
                  if (daySlots.length === 0 && selectedDay !== "All") {
                    return (
                      <div key={day} className="text-center py-10 text-gray-400 text-sm">
                        No slots for {day}
                      </div>
                    );
                  }
                  if (daySlots.length === 0) return null;

                  const c = DAY_COLORS[day];
                  return (
                    <div key={day}>
                      {/* Day Header */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                        <span className={`text-xs font-bold ${c.text}`}>{day}</span>
                        <span className="text-xs text-gray-300 font-medium">
                          {daySlots.length} slot{daySlots.length > 1 ? "s" : ""}
                        </span>
                      </div>

                      <div className="space-y-2 mb-2">
                        {daySlots.map((slot) => (
                          <div
                            key={slot._id}
                            className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all
                              ${slot.isActive
                                ? `${c.bg} border-transparent`
                                : "bg-gray-50 border-gray-100 opacity-60"
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <Clock size={14} className={slot.isActive ? c.text : "text-gray-400"} />
                              <span className={`text-sm font-semibold ${slot.isActive ? c.text : "text-gray-400"}`}>
                                {slot.startTime} – {slot.endTime}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Active badge */}
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                slot.isActive
                                  ? "bg-green-100 text-green-600"
                                  : "bg-gray-200 text-gray-400"
                              }`}>
                                {slot.isActive ? "Active" : "Inactive"}
                              </span>

                              {/* Toggle */}
                              <button
                                onClick={() => handleToggle(slot)}
                                className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition"
                                title={slot.isActive ? "Deactivate" : "Activate"}
                              >
                                {slot.isActive
                                  ? <XCircle size={13} className="text-gray-400" />
                                  : <CheckCircle size={13} className="text-green-500" />
                                }
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => handleDelete(slot._id)}
                                className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition"
                                title="Delete"
                              >
                                <Trash2 size={13} className="text-red-400" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {slots.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                    <Calendar size={36} className="mb-3 opacity-30" />
                    <p className="text-sm font-medium">No availability slots yet</p>
                    <p className="text-xs mt-1">Add your first slot using the form</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}