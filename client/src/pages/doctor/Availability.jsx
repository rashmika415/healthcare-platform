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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const [form, setForm] = useState({ 
    day: "Monday", 
    startTime: "", 
    endTime: "",
    date: new Date().toISOString().split('T')[0]
  });

  // Generate dates for next 30 days
  const generateFutureDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const futureDates = generateFutureDates();

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
      setForm({ 
        day: "Monday", 
        startTime: "", 
        endTime: "",
        date: form.date // Keep the selected date instead of resetting to today
      });
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

  // Group slots by date instead of day
  const groupedByDate = slots.reduce((acc, slot) => {
    const date = slot.date || 'No Date';
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(slot);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedByDate).sort();

  return (
    <>
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

              {/* Date and Day Selector */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="mb-4">
                  <label className="text-xs font-semibold text-gray-500 mb-2 block flex items-center gap-1">
                    <Calendar size={11} /> Date
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
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
              </div>

              {/* Quick Date Selection */}
              <div className="mb-4">
                <label className="text-xs font-semibold text-gray-500 mb-2 block">Quick Select Date</label>
                <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                  {futureDates.map((date) => {
                    const isSelected = form.date === date;
                    const isToday = date === new Date().toISOString().split('T')[0];
                    const dateObj = new Date(date);
                    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                    const dayNum = dateObj.getDate();
                    
                    return (
                      <button
                        key={date}
                        type="button"
                        onClick={() => setForm({ ...form, date })}
                        className={`p-2 rounded-lg text-xs font-medium transition-all border
                          ${isSelected
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : isToday
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                          }`}
                      >
                        <div className="text-center">
                          <div className="font-semibold">{dayNum}</div>
                          <div className="text-xs">{dayName}</div>
                        </div>
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
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                  Loading schedule...
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedDates.map((date) => {
                    const dateSlots = groupedByDate[date];
                    if (dateSlots.length === 0) return null;

                    return (
                      <div key={date}>
                        {/* Date Header */}
                        <div className="flex items-center gap-2 mb-3">
                          <Calendar size={14} className="text-gray-400" />
                          <span className="text-sm font-bold text-gray-700">
                            {date && !isNaN(new Date(date).getTime()) 
                              ? new Date(date).toLocaleDateString('en-US', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })
                              : date
                            }
                          </span>
                          <span className="text-xs text-gray-400 font-medium">
                            ({dateSlots.length} slot{dateSlots.length > 1 ? "s" : ""})
                          </span>
                        </div>

                        <div className="space-y-2">
                          {dateSlots.map((slot) => {
                            const c = DAY_COLORS[slot.day] || DAY_COLORS.Monday;
                            return (
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
                                  <div>
                                    <span className={`text-sm font-semibold ${slot.isActive ? c.text : "text-gray-400"}`}>
                                      {slot.day} {slot.date && !isNaN(new Date(slot.date).getTime()) 
                                        ? new Date(slot.date).getDate() 
                                        : ''
                                      } {slot.startTime} – {slot.endTime}
                                    </span>
                                    <span className="text-xs text-gray-500 block">
                                      {slot.isActive ? "Active" : "Inactive"}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
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
                            );
                          })}
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
    </>
  );
}
