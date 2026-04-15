import { useEffect, useState } from "react";
import api from "../../services/api";
import Sidebar from "../../components/doctor/Sidebar";
import StatCard from "../../components/doctor/StatCard";
import AnalyticsChart from "../../components/doctor/AnalyticsChart";
import RealCalendar from "../../components/doctor/RealCalendar";
import {
  CalendarDays, CheckCircle, Clock,
  Video, Activity, Syringe, ArrowUpRight,
  Pill, Stethoscope,
} from "lucide-react";

const TYPE_CONFIG = {
  "Online consultation": { icon: Video,       color: "bg-blue-100 text-blue-600"     },
  "Check-up":            { icon: Activity,    color: "bg-green-100 text-green-600"   },
  "Injection":           { icon: Syringe,     color: "bg-purple-100 text-purple-600" },
  "Cardiology":          { icon: Stethoscope, color: "bg-rose-100 text-rose-600"     },
  "Prescription":        { icon: Pill,        color: "bg-amber-100 text-amber-600"   },
};

const getTypeConfig = (dept) =>
  TYPE_CONFIG[dept] || { icon: Activity, color: "bg-slate-100 text-slate-500" };

const getStoredUser = () => {
  try {
    const p = localStorage.getItem("authPersistence");
    if (p === "local") return JSON.parse(localStorage.getItem("user")) || {};
    return JSON.parse(sessionStorage.getItem("user")) || JSON.parse(localStorage.getItem("user")) || {};
  } catch { return {}; }
};

// ── Welcome Banner ─────────────────────────────────────
function WelcomeBanner({ user }) {
  const firstName = user?.name?.split(" ")[0] || "Doctor";

  return (
    <div className="relative bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 rounded-2xl overflow-hidden mb-6 shadow-lg">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-40 w-56 h-56 bg-blue-500/10 rounded-full -translate-y-1/2" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-indigo-400/10 rounded-full translate-y-1/2" />
        <div className="absolute top-1/2 right-20 w-20 h-20 bg-rose-400/10 rounded-full" />
      </div>

      {/* Banner body only — no topbar */}
      <div className="relative flex items-center justify-between px-7 py-6">
        {/* Left */}
        <div className="flex-1 z-10">
          <h2 className="text-2xl font-bold text-white mb-0.5">
            Good day, Dr. {firstName}!
          </h2>
          <p className="text-slate-400 text-sm mb-5">Have a nice time!</p>

          {/* Voice button */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-2.5 w-fit hover:bg-white/15 transition-all cursor-pointer group">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/40 group-hover:scale-110 transition-transform flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M12 15c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v7c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 15 6.7 12H5c0 3.41 2.72 6.23 6 6.72V21h2v-2.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
              </svg>
            </div>
            <div>
              <p className="text-white text-xs font-semibold">How can I help you today?</p>
              <p className="text-slate-400 text-[11px]">Just click and start talking</p>
            </div>
          </div>
        </div>

        {/* Right: SVG Illustration */}
        <div className="relative flex-shrink-0 ml-4 z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-rose-400/20 rounded-full blur-2xl scale-150 pointer-events-none" />
          <svg
            width="130" height="125"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="relative z-10 drop-shadow-2xl"
          >
            <ellipse cx="100" cy="158" rx="46" ry="34" fill="#f8fafc" />
            <ellipse cx="100" cy="158" rx="46" ry="34" fill="url(#coatGrad)" />
            <path d="M80 132 L100 148 L120 132 L115 122 L100 138 L85 122 Z" fill="#e2e8f0" />
            <rect x="97" y="150" width="6" height="14" rx="2" fill="#ef4444" />
            <rect x="93" y="154" width="14" height="6" rx="2" fill="#ef4444" />
            <path d="M84 142 Q74 157 79 167 Q84 174 91 170"
              stroke="#64748b" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            <circle cx="91" cy="172" r="4" fill="#3b82f6" />
            <circle cx="85" cy="142" r="3" fill="#94a3b8" />
            <circle cx="91" cy="139" r="3" fill="#94a3b8" />
            <rect x="110" y="127" width="26" height="32" rx="3" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1"/>
            <rect x="117" y="123" width="12" height="8" rx="2" fill="#cbd5e1"/>
            <line x1="115" y1="138" x2="131" y2="138" stroke="#94a3b8" strokeWidth="1.5"/>
            <line x1="115" y1="143" x2="131" y2="143" stroke="#94a3b8" strokeWidth="1.5"/>
            <line x1="115" y1="148" x2="125" y2="148" stroke="#3b82f6" strokeWidth="1.5"/>
            <ellipse cx="67" cy="148" rx="11" ry="20" fill="#f8fafc" transform="rotate(-8 67 148)" />
            <ellipse cx="133" cy="148" rx="11" ry="20" fill="#f8fafc" transform="rotate(8 133 148)" />
            <rect x="93" y="106" width="14" height="20" rx="7" fill="#fcd5b0" />
            <ellipse cx="100" cy="90" rx="27" ry="28" fill="#fcd5b0" />
            <ellipse cx="100" cy="67" rx="27" ry="14" fill="#92400e" />
            <ellipse cx="77" cy="82" rx="7" ry="13" fill="#92400e" />
            <ellipse cx="123" cy="82" rx="7" ry="13" fill="#92400e" />
            <rect x="73" y="67" width="54" height="12" fill="#92400e" />
            <circle cx="100" cy="59" r="11" fill="#92400e" />
            <ellipse cx="100" cy="57" rx="9" ry="7" fill="#b45309" />
            <ellipse cx="100" cy="56" rx="5" ry="3" fill="#d97706" opacity="0.5"/>
            <ellipse cx="91" cy="88" rx="4.5" ry="5" fill="white" />
            <ellipse cx="109" cy="88" rx="4.5" ry="5" fill="white" />
            <circle cx="92" cy="89" r="2.8" fill="#1e293b" />
            <circle cx="110" cy="89" r="2.8" fill="#1e293b" />
            <circle cx="93" cy="88" r="1" fill="white" />
            <circle cx="111" cy="88" r="1" fill="white" />
            <path d="M87 83 Q91 80 95 82" stroke="#78350f" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
            <path d="M105 82 Q109 80 113 83" stroke="#78350f" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
            <path d="M93 99 Q100 105 107 99" stroke="#c2410c" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            <circle cx="84" cy="96" r="5" fill="#fca5a5" opacity="0.45" />
            <circle cx="116" cy="96" r="5" fill="#fca5a5" opacity="0.45" />
            <path d="M152 72 C152 69 149 67 147 69 C145 67 142 69 142 72 C142 76 147 81 147 81 C147 81 152 76 152 72Z"
              fill="#f87171" opacity="0.95"/>
            <rect x="60" y="155" width="16" height="12" rx="3" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="1"/>
            <rect x="65" y="152" width="6" height="5" rx="1.5" fill="#93c5fd"/>
            <defs>
              <linearGradient id="coatGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="100%" stopColor="#e2e8f0" stopOpacity="1" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute top-1 right-1 animate-bounce">
            <span className="text-base">❤️</span>
          </div>
          <div className="absolute bottom-3 left-1 animate-pulse">
            <div className="w-5 h-2.5 bg-blue-400/50 rounded-full rotate-45" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────
export default function DoctorDashboard() {
  const [stats, setStats]               = useState({ total: 0, approved: 0, pending: 0 });
  const [appointments, setAppointments] = useState([]);
  const [selected, setSelected]         = useState(null);
  const [doctorProfileId, setDoctorProfileId] = useState("");

  const user = getStoredUser();

  useEffect(() => { fetchDashboard(); }, []);

  const authDoctorId =
    String(user?.id ?? user?._id ?? user?.userId ?? user?.doctorId ?? "");

  const resolveDoctorProfileId = async () => {
    try {
      const res = await api.get("/doctor/profile");
      const id = String(res.data?._id || "").trim();
      if (id) setDoctorProfileId(id);
      return id || "";
    } catch {
      // Fallback: resolve by email when doctor profile isn't created yet
      try {
        const email = String(user?.email || "").trim().toLowerCase();
        if (!email) return "";
        const res = await api.get(`/doctor/internal/by-email/${encodeURIComponent(email)}`);
        const id = String(res.data?.doctor?._id || "").trim();
        if (id) setDoctorProfileId(id);
        return id || "";
      } catch {
        return "";
      }
    }
  };

  const normalizeStatus = (raw) => {
    const s = String(raw || "").toLowerCase();
    if (!s) return "pending";
    if (s === "booked") return "pending";
    if (s === "approved") return "accepted";
    return s;
  };

  const mapAppointment = (a) => ({
    ...a,
    status: normalizeStatus(a.status),
    timeSlot: a.timeSlot || a.time || "--",
  });

  const fetchDashboard = async () => {
    try {
      const profileId =
        doctorProfileId || (await resolveDoctorProfileId());
      const doctorId = profileId || authDoctorId;

      if (!doctorId) {
        setAppointments([]);
        setStats({ total: 0, approved: 0, pending: 0 });
        setSelected(null);
        return;
      }

      // Primary: appointment-service doctor list (through gateway)
      let list = [];
      try {
        const res = await api.get(`/appointments/doctor/${encodeURIComponent(doctorId)}`);
        list = Array.isArray(res.data?.appointments) ? res.data.appointments : [];
      } catch {
        // Fallback: fetch-all and filter (works even if doctor endpoint isn't available)
        const res = await api.get("/appointments/getallappointments");
        const all = Array.isArray(res.data?.appointments) ? res.data.appointments : [];
        list = all.filter(a => String(a.doctorId) === String(doctorId));
      }

      const data = list.map(mapAppointment);
      setAppointments(data);
      setStats({
        total:    data.length,
        approved: data.filter(a => a.status === "accepted" || a.status === "approved").length,
        pending:  data.filter(a => a.status === "pending" || a.status === "booked").length,
      });
      if (data.length > 0) setSelected(data[0]);
    } catch (err) {
      console.error(err);
    }
  };

  const todayList = appointments.filter(
    a => new Date(a.date).toDateString() === new Date().toDateString()
  );
  const displayList = todayList.length > 0 ? todayList : appointments.slice(0, 6);

  useEffect(() => {
    const onChanged = () => fetchDashboard();
    window.addEventListener("appointments:changed", onChanged);
    return () => window.removeEventListener("appointments:changed", onChanged);
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex-1 p-6 overflow-auto">

        {/* ── Welcome Banner ── */}
        <WelcomeBanner user={user} />

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard title="Total Appointments" value={stats.total}    icon={CalendarDays} color="blue"   change={12} />
          <StatCard title="Approved"           value={stats.approved} icon={CheckCircle}  color="green"  change={8}  />
          <StatCard title="Pending"            value={stats.pending}  icon={Clock}        color="yellow" change={-3} />
        </div>

        {/* ── 3-col grid ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">

          {/* Patient List */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div>
                <h2 className="font-bold text-slate-800 text-sm">
                  Patient's list
                  <span className="ml-2 text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                    {displayList.length}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {new Date().toLocaleDateString("en-US", {
                    month: "long", day: "numeric", year: "numeric"
                  })}
                </p>
              </div>
            </div>

            <div className="px-3 pb-4 space-y-1 max-h-80 overflow-y-auto">
              {displayList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <CalendarDays size={28} className="mb-2 opacity-30" />
                  <p className="text-xs font-medium">No appointments today</p>
                  <p className="text-[11px] mt-0.5 text-slate-300">New appointments will appear here</p>
                </div>
              ) : (
                displayList.map(a => {
                  const cfg  = getTypeConfig(a.department);
                  const Icon = cfg.icon;
                  const isActive = selected?._id === a._id;
                  return (
                    <div
                      key={a._id}
                      onClick={() => setSelected(a)}
                      className={`flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-all duration-200
                        ${isActive ? "bg-blue-50 border border-blue-100" : "hover:bg-slate-50"}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                          <Icon size={15} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-700">
                            {a.department || "Consultation"}
                          </p>
                          <p className="text-[11px] text-slate-400">{a.patientName || "Unknown"}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0 ${
                        isActive ? "bg-red-500 text-white" : "text-slate-400 bg-slate-100"
                      }`}>
                        {a.timeSlot || a.time || "--"}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Detail Panel */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            {selected ? (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-blue-600 font-bold text-base border border-blue-100">
                      {selected.patientName?.charAt(0)?.toUpperCase() || "P"}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">
                        {selected.patientName || "Patient"}
                      </h3>
                      <p className="text-xs text-blue-500 font-medium">
                        #{selected._id?.slice(-8).toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <button className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center hover:bg-slate-200 transition">
                    <ArrowUpRight size={13} className="text-slate-500" />
                  </button>
                </div>

                {selected.reason && (
                  <div className="mb-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Complaint
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.reason.split(",").map((r, i) => (
                        <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-medium">
                          {r.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-slate-50 rounded-xl p-3 mb-4 space-y-2.5">
                  {[
                    {
                      label: "Date",
                      value: selected.date
                        ? new Date(selected.date).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric"
                          })
                        : "--"
                    },
                    { label: "Time",   value: selected.timeSlot || selected.time || "--" },
                    { label: "Type",   value: selected.department || "General"           },
                    { label: "Status", value: selected.status, isStatus: true            },
                  ].map(({ label, value, isStatus }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">{label}</span>
                      {isStatus ? (
                        <span className={`text-xs font-bold capitalize px-2 py-0.5 rounded-lg ${
                          value === "approved" || value === "accepted"
                            ? "bg-emerald-100 text-emerald-600"
                            : value === "pending"
                            ? "bg-amber-100 text-amber-600"
                            : "bg-rose-100 text-rose-500"
                        }`}>
                          {value}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-700">{value}</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button className="border border-slate-200 text-slate-600 text-xs font-semibold py-2.5 rounded-xl hover:bg-slate-50 transition">
                    Edit
                  </button>
                  <button className="bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs font-semibold py-2.5 rounded-xl hover:opacity-90 transition shadow-lg shadow-blue-500/25">
                    Chat
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-16 text-slate-400">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
                  <Stethoscope size={22} className="opacity-40" />
                </div>
                <p className="text-sm font-medium">Select a patient</p>
                <p className="text-xs mt-1 text-slate-300">Click any appointment to view details</p>
              </div>
            )}
          </div>

          {/* Calendar */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-800 text-sm">Availability</h2>
              <div className="flex gap-2 text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />Consultation
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block" />Surgery
                </span>
              </div>
            </div>
            <RealCalendar />
          </div>
        </div>

        {/* ── Bottom Row: Schedule + Chart ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* Today Schedule */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-slate-800 text-sm">Today's Schedule</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long", month: "short", day: "numeric"
                  })}
                </p>
              </div>
              <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-2.5 py-1 rounded-lg">
                {todayList.length} appts
              </span>
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {todayList.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Clock size={24} className="mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-medium">No appointments today</p>
                </div>
              ) : (
                todayList.map(a => {
                  const cfg  = getTypeConfig(a.department);
                  const Icon = cfg.icon;
                  return (
                    <div key={a._id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                        <Icon size={13} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-700 truncate">
                          {a.department || "Consultation"}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">{a.patientName}</p>
                      </div>
                      <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg flex-shrink-0">
                        {a.timeSlot || a.time || "--"}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Chart */}
          <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-slate-800 text-sm">Appointments Trend</h2>
                <p className="text-xs text-slate-400 mt-0.5">Patient visits over time</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                Patients
              </span>
            </div>
            <AnalyticsChart appointments={appointments} />
          </div>
        </div>

      </div>
    </div>
  );
}