import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import Sidebar from "../../components/doctor/Sidebar";
import RealCalendar from "../../components/doctor/RealCalendar";
import { getOrCreateSessionByAppointment, joinSession } from "../../services/videoApi";
import { toast, Toaster } from "react-hot-toast";
import {
  Video,
  Activity,
  Syringe,
  Pill,
  Stethoscope,
  MessageCircle,
  SquarePen,
  CalendarDays,
  TrendingUp,
  Users,
  Clock3,
  ArrowUpRight,
  BellRing,
} from "lucide-react";

const TYPE_CONFIG = {
  "Online consultation": { icon: Video, color: "bg-blue-100 text-blue-600" },
  "Check-up": { icon: Activity, color: "bg-green-100 text-green-600" },
  "Injection": { icon: Syringe, color: "bg-purple-100 text-purple-600" },
  Cardiology: { icon: Stethoscope, color: "bg-rose-100 text-rose-600" },
  Prescription: { icon: Pill, color: "bg-amber-100 text-amber-600" },
};

const getTypeConfig = (dept) =>
  TYPE_CONFIG[dept] || {
    icon: Activity,
    color: "bg-slate-100 text-slate-500",
  };

const getStoredUser = () => {
  try {
    const p = localStorage.getItem("authPersistence");
    if (p === "local") return JSON.parse(localStorage.getItem("user")) || {};
    return (
      JSON.parse(sessionStorage.getItem("user")) ||
      JSON.parse(localStorage.getItem("user")) ||
      {}
    );
  } catch {
    return {};
  }
};

const getPatientPhoto = (a) =>
  a?.patientPhoto ||
  a?.patientImage ||
  a?.patientAvatar ||
  a?.patientProfilePhoto ||
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    a?.patientName || "Patient"
  )}&background=e2e8f0&color=334155`;

const getAvatarRingClass = (seed = "") => {
  const rings = [
    "from-cyan-400 via-blue-500 to-indigo-500",
    "from-fuchsia-400 via-pink-500 to-rose-500",
    "from-emerald-400 via-teal-500 to-cyan-500",
    "from-amber-400 via-orange-500 to-rose-500",
    "from-violet-400 via-purple-500 to-indigo-500",
    "from-lime-400 via-emerald-500 to-teal-500",
  ];

  const text = String(seed);
  let sum = 0;
  for (let i = 0; i < text.length; i += 1) sum += text.charCodeAt(i);
  return rings[sum % rings.length];
};

// ── Welcome Banner ─────────────────────────────────────
function WelcomeBanner({ user }) {
  const firstName = user?.name?.split(" ")[0] || "Doctor";

  return (
    <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 shadow-[0_25px_60px_-20px_rgba(15,23,42,0.45)]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-16 left-1/3 w-72 h-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute -bottom-16 right-10 w-64 h-64 rounded-full bg-fuchsia-400/10 blur-3xl" />
        <div className="absolute top-0 right-40 w-56 h-56 bg-blue-500/10 rounded-full -translate-y-1/2" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-indigo-400/10 rounded-full translate-y-1/2" />
        <div className="absolute top-1/2 right-20 w-20 h-20 bg-rose-400/10 rounded-full" />
      </div>

      <div className="relative flex items-center justify-between px-7 py-6">
        <div className="flex-1 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[11px] text-slate-200 mb-4 backdrop-blur-sm">
            <BellRing size={12} />
            Premium Doctor Workspace
          </div>

          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-1">
            Good day, Dr. {firstName}!
          </h2>
          <p className="text-slate-300 text-sm mb-5">
            Here is your smart consultation overview for today.
          </p>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 w-fit hover:bg-white/15 transition-all cursor-pointer group shadow-lg">
            <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/40 group-hover:scale-110 transition-transform flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M12 15c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v7c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 15 6.7 12H5c0 3.41 2.72 6.23 6 6.72V21h2v-2.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
              </svg>
            </div>
            <div>
              <p className="text-white text-xs font-semibold">
                How can I help you today?
              </p>
              <p className="text-slate-300 text-[11px]">
                Just click and start talking
              </p>
            </div>
          </div>
        </div>

        <div className="relative flex-shrink-0 ml-4 z-10 hidden md:block">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-rose-400/20 rounded-full blur-2xl scale-150 pointer-events-none" />
          <svg
            width="130"
            height="125"
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
            <path
              d="M84 142 Q74 157 79 167 Q84 174 91 170"
              stroke="#64748b"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx="91" cy="172" r="4" fill="#3b82f6" />
            <circle cx="85" cy="142" r="3" fill="#94a3b8" />
            <circle cx="91" cy="139" r="3" fill="#94a3b8" />
            <rect x="110" y="127" width="26" height="32" rx="3" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
            <rect x="117" y="123" width="12" height="8" rx="2" fill="#cbd5e1" />
            <line x1="115" y1="138" x2="131" y2="138" stroke="#94a3b8" strokeWidth="1.5" />
            <line x1="115" y1="143" x2="131" y2="143" stroke="#94a3b8" strokeWidth="1.5" />
            <line x1="115" y1="148" x2="125" y2="148" stroke="#3b82f6" strokeWidth="1.5" />
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
            <ellipse cx="100" cy="56" rx="5" ry="3" fill="#d97706" opacity="0.5" />
            <ellipse cx="91" cy="88" rx="4.5" ry="5" fill="white" />
            <ellipse cx="109" cy="88" rx="4.5" ry="5" fill="white" />
            <circle cx="92" cy="89" r="2.8" fill="#1e293b" />
            <circle cx="110" cy="89" r="2.8" fill="#1e293b" />
            <circle cx="93" cy="88" r="1" fill="white" />
            <circle cx="111" cy="88" r="1" fill="white" />
            <path d="M87 83 Q91 80 95 82" stroke="#78350f" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d="M105 82 Q109 80 113 83" stroke="#78350f" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d="M93 99 Q100 105 107 99" stroke="#c2410c" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <circle cx="84" cy="96" r="5" fill="#fca5a5" opacity="0.45" />
            <circle cx="116" cy="96" r="5" fill="#fca5a5" opacity="0.45" />
            <path
              d="M152 72 C152 69 149 67 147 69 C145 67 142 69 142 72 C142 76 147 81 147 81 C147 81 152 76 152 72Z"
              fill="#f87171"
              opacity="0.95"
            />
            <rect x="60" y="155" width="16" height="12" rx="3" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="1" />
            <rect x="65" y="152" width="6" height="5" rx="1.5" fill="#93c5fd" />
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

function PremiumStatCard({ title, value, sub, icon: Icon, tint = "cyan", line = "from-cyan-400 to-blue-500" }) {
  const tintMap = {
    cyan: "bg-cyan-50 text-cyan-700 border-cyan-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    violet: "bg-violet-50 text-violet-700 border-violet-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
  };

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.35)]">
      <div className={`absolute left-0 right-0 top-0 h-1 bg-gradient-to-r ${line}`} />
      <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-slate-100/70" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">{value}</p>
          <p className="text-xs text-slate-400 mt-1">{sub}</p>
        </div>
        <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${tintMap[tint]}`}>
          <Icon size={18} />
        </div>
      </div>
      <div className="mt-4 h-12 rounded-2xl bg-gradient-to-r from-slate-50 via-white to-slate-50 border border-slate-100 flex items-end px-3 pb-2 gap-1">
        <span className="w-2 rounded-full bg-slate-200 h-4" />
        <span className="w-2 rounded-full bg-slate-300 h-7" />
        <span className="w-2 rounded-full bg-slate-200 h-5" />
        <span className="w-2 rounded-full bg-slate-300 h-9" />
        <span className={`w-2 rounded-full bg-gradient-to-t ${line} h-10`} />
        <span className="w-2 rounded-full bg-slate-300 h-6" />
        <span className="w-2 rounded-full bg-slate-200 h-8" />
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────
export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [doctorProfileId, setDoctorProfileId] = useState("");
  const [joiningId, setJoiningId] = useState(null);

  const user = getStoredUser();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const authDoctorId = String(
    user?.id ?? user?._id ?? user?.userId ?? user?.doctorId ?? ""
  );

  const resolveDoctorProfileId = async () => {
    try {
      const res = await api.get("/doctor/profile");
      const id = String(res.data?._id || "").trim();
      if (id) setDoctorProfileId(id);
      return id || "";
    } catch {
      try {
        const email = String(user?.email || "").trim().toLowerCase();
        if (!email) return "";
        const res = await api.get(
          `/doctor/internal/by-email/${encodeURIComponent(email)}`
        );
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
      const profileId = doctorProfileId || (await resolveDoctorProfileId());
      const doctorId = profileId || authDoctorId;

      if (!doctorId) {
        setAppointments([]);
        setSelected(null);
        return;
      }

      let list = [];
      try {
        const res = await api.get(
          `/appointments/doctor/${encodeURIComponent(doctorId)}`
        );
        list = Array.isArray(res.data?.appointments)
          ? res.data.appointments
          : [];
      } catch {
        const res = await api.get("/appointments/getallappointments");
        const all = Array.isArray(res.data?.appointments)
          ? res.data.appointments
          : [];
        list = all.filter((a) => String(a.doctorId) === String(doctorId));
      }

      const data = list.map(mapAppointment);
      setAppointments(data);
      if (data.length > 0) setSelected(data[0]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoinCall = async (appointmentId) => {
    // Open the window immediately to bypass popup blockers
    const meetingWindow = window.open('about:blank', '_blank');
    if (meetingWindow) {
      meetingWindow.document.write('<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;color:#666;background:#f8fafc;"><div><h2 style="margin-bottom:8px;color:#1e293b;">Entering Consultation...</h2><p>Please wait while we prepare your secure room.</p></div></body></html>');
    }

    try {
      setJoiningId(appointmentId);
      const sessionData = await getOrCreateSessionByAppointment(appointmentId);
      const joinData = await joinSession(
        sessionData.session.sessionId,
        sessionData.join.participantToken
      );

      if (joinData.meeting?.url) {
        if (meetingWindow) {
          meetingWindow.location.href = joinData.meeting.url;
        } else {
          window.open(joinData.meeting.url, "_blank");
        }
        toast.success("Consultation room opened!");
      } else {
        throw new Error("No meeting URL received");
      }
    } catch (err) {
      console.error("Video join error:", err);
      if (meetingWindow) meetingWindow.close();
      toast.error(err.response?.data?.error || "Failed to enter consultation.");
    } finally {
      setJoiningId(null);
    }
  };

  const todayList = appointments.filter(
    (a) => new Date(a.date).toDateString() === new Date().toDateString()
  );
  const displayList =
    todayList.length > 0 ? todayList : appointments.slice(0, 6);

  useEffect(() => {
    const onChanged = () => fetchDashboard();
    window.addEventListener("appointments:changed", onChanged);
    return () => window.removeEventListener("appointments:changed", onChanged);
  }, []);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50/40">
      <Toaster position="top-center" />
      <Sidebar />

      <div className="flex-1 p-6 overflow-auto">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <div className="xl:col-span-8 space-y-5">
            <WelcomeBanner user={user} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <PremiumStatCard
                title="Today's appointments"
                value={todayList.length}
                sub="Scheduled for today"
                icon={CalendarDays}
                tint="cyan"
                line="from-cyan-400 to-blue-500"
              />
              <PremiumStatCard
                title="All patients"
                value={appointments.length}
                sub="Total current bookings"
                icon={Users}
                tint="emerald"
                line="from-emerald-400 to-teal-500"
              />
              <PremiumStatCard
                title="Active sessions"
                value={appointments.filter((a) => a.status === "accepted").length}
                sub="Accepted consultations"
                icon={TrendingUp}
                tint="violet"
                line="from-violet-400 to-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-[26px] border border-white/70 bg-white/90 backdrop-blur-xl p-4 shadow-[0_25px_60px_-30px_rgba(15,23,42,0.30)]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-bold text-slate-800 text-xl">
                      Patient&apos;s list
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Select a patient to view details
                    </p>
                  </div>
                  <span className="min-w-8 h-8 px-2 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center">
                    {displayList.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {displayList.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 text-sm rounded-2xl border border-dashed border-slate-200">
                      No appointments found
                    </div>
                  ) : (
                    displayList.slice(0, 7).map((a) => {
                      const cfg = getTypeConfig(a.department);
                      const Icon = cfg.icon;
                      const isActive = selected?._id === a._id;
                      const ringClass = getAvatarRingClass(
                        a?.patientName || a?._id || "patient"
                      );

                      return (
                        <button
                          key={a._id}
                          onClick={() => setSelected(a)}
                          className={`group w-full text-left rounded-[22px] px-3.5 py-3 border transition-all ${
                            isActive
                              ? "bg-gradient-to-r from-slate-50 to-blue-50 border-slate-300 shadow-md"
                              : "bg-white border-slate-200 hover:bg-slate-50 hover:shadow-sm"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div
                                className={`p-[2.5px] rounded-full bg-gradient-to-br ${ringClass} shadow-sm`}
                              >
                                <img
                                  src={getPatientPhoto(a)}
                                  alt={a.patientName || "Patient"}
                                  className="w-11 h-11 rounded-full object-cover border-2 border-white bg-white"
                                />
                              </div>
                              <span className="absolute -right-0.5 -bottom-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-white" />
                            </div>

                            <div
                              className={`w-9 h-9 rounded-2xl flex items-center justify-center ${cfg.color} shadow-sm`}
                            >
                              <Icon size={14} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-700 truncate">
                                {a.patientName || "Unknown patient"}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">
                                {a.department || "Consultation"}
                              </p>
                            </div>

                            <div className="text-right shrink-0">
                              <p className="text-xs font-semibold text-slate-600">
                                {a.timeSlot || "--"}
                              </p>
                              <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-slate-400">
                                View
                                <ArrowUpRight size={11} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="rounded-[26px] border border-white/70 bg-white/90 backdrop-blur-xl p-4 shadow-[0_25px_60px_-30px_rgba(15,23,42,0.30)]">
                {selected ? (
                  <>
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div
                            className={`p-[3px] rounded-full bg-gradient-to-br ${getAvatarRingClass(
                              selected?.patientName || selected?._id || "selected"
                            )} shadow-md`}
                          >
                            <img
                              src={getPatientPhoto(selected)}
                              alt={selected.patientName || "Patient"}
                              className="w-14 h-14 rounded-full object-cover border-2 border-white bg-white"
                            />
                          </div>
                          <span className="absolute -right-1 bottom-0 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-white" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-lg">
                            {selected.patientName || "Patient"}
                          </p>
                          <p className="text-xs text-slate-400">
                            Reservation #{selected._id?.slice(-8)}
                          </p>
                        </div>
                      </div>

                      <div className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold capitalize">
                        {selected.status}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="rounded-2xl bg-slate-50 border border-slate-100 px-3 py-2.5">
                        <p className="text-[11px] text-slate-400">Date</p>
                        <p className="text-xs font-semibold text-slate-700 mt-1">
                          {selected.date
                            ? new Date(selected.date).toLocaleDateString()
                            : "--"}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 border border-slate-100 px-3 py-2.5">
                        <p className="text-[11px] text-slate-400">Time</p>
                        <p className="text-xs font-semibold text-slate-700 mt-1">
                          {selected.timeSlot || "--"}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 border border-slate-100 px-3 py-2.5">
                        <p className="text-[11px] text-slate-400">Type</p>
                        <p className="text-xs font-semibold text-slate-700 mt-1 truncate">
                          {selected.department || "Consultation"}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-[22px] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 mb-4 shadow-inner">
                      <p className="text-xs text-slate-400 mb-2">Complaint</p>
                      <div className="flex flex-wrap gap-2">
                        {String(selected.reason || "General check")
                          .split(",")
                          .slice(0, 4)
                          .map((r, i) => (
                            <span
                              key={i}
                              className="text-[11px] px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 shadow-sm"
                            >
                              {r.trim()}
                            </span>
                          ))}
                      </div>
                    </div>

                    <div className="rounded-[22px] bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-50 border border-blue-100 p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-500">Consultation readiness</p>
                          <p className="text-sm font-semibold text-slate-800 mt-1">
                            Patient information is ready to review
                          </p>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-blue-600 shadow-sm">
                          <Clock3 size={18} />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button className="border border-slate-200 bg-white rounded-2xl py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm">
                        Edit
                      </button>
                      <button className="rounded-2xl py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-blue-600 hover:opacity-95 transition shadow-lg shadow-blue-500/20">
                        Chat
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="h-full min-h-[220px] flex items-center justify-center text-slate-400 rounded-2xl border border-dashed border-slate-200">
                    Select a patient
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 relative overflow-hidden rounded-[26px] bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-5 text-white shadow-[0_30px_60px_-25px_rgba(59,130,246,0.50)]">
                <div className="absolute -top-10 -right-8 w-36 h-36 rounded-full bg-white/10 blur-md" />
                <div className="absolute -bottom-8 left-20 w-28 h-28 rounded-full bg-cyan-300/10 blur-md" />
                <div className="absolute top-12 right-32 w-16 h-16 rounded-full border border-white/10 bg-white/5" />

                <div className="relative flex flex-col h-full">
                  <div className="flex items-start justify-between gap-3 mb-6">
                    <div className="max-w-[75%]">
                      <p className="text-xs uppercase tracking-[0.18em] text-blue-100/90 font-semibold">
                        Video service
                      </p>
                      <h3 className="text-2xl font-bold mt-1">
                        Live consultation room
                      </h3>
                      <p className="text-sm text-blue-100 mt-2 leading-relaxed max-w-lg">
                        Start secure doctor-patient video chat for instant
                        follow-up and seamless remote care.
                      </p>
                    </div>

                    <div className="w-14 h-14 rounded-[20px] bg-white/15 border border-white/15 flex items-center justify-center shadow-md shrink-0 backdrop-blur-sm">
                      <Video size={24} />
                    </div>
                  </div>

                <div className="grid grid-cols-2 gap-2">
                  <button className="border border-slate-200 text-slate-600 text-xs font-semibold py-2.5 rounded-xl hover:bg-slate-50 transition">
                    Edit
                  </button>
                  <button 
                    onClick={() => selected?._id && handleJoinCall(selected._id)}
                    disabled={!selected || joiningId === selected._id || selected.status !== 'accepted' || String(selected.paymentStatus || '').toLowerCase() !== 'completed'}
                    className={`bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs font-semibold py-2.5 rounded-xl hover:opacity-90 transition shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 
                      ${(!selected || joiningId === selected._id || selected.status !== 'accepted' || String(selected.paymentStatus || '').toLowerCase() !== 'completed') ? 'opacity-70 cursor-not-allowed grayscale' : ''}`}
                  >
                    {joiningId === (selected?._id) ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Joining...
                      </>
                    ) : (selected && String(selected.paymentStatus || '').toLowerCase() !== 'completed') ? (
                      "Payment Pending"
                    ) : (selected && selected.status !== 'accepted') ? (
                      "Accept to Join"
                    ) : (
                      "Join Meeting"
                    )}
                  </button>
                </div>
              </div>

              <div className="rounded-[26px] border border-white/70 bg-white/90 backdrop-blur-xl p-4 shadow-[0_25px_60px_-30px_rgba(15,23,42,0.30)]">
                <p className="text-xs text-slate-400">Dashboard summary</p>
                <p className="text-lg font-bold text-slate-800 mt-1">
                  Today at a glance
                </p>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="rounded-2xl bg-cyan-50 text-cyan-700 px-4 py-3 font-semibold border border-cyan-100">
                    Total appointments: {appointments.length}
                  </div>
                  <div className="rounded-2xl bg-emerald-50 text-emerald-700 px-4 py-3 font-semibold border border-emerald-100">
                    Today schedule: {todayList.length}
                  </div>
                  <div className="rounded-2xl bg-amber-50 text-amber-700 px-4 py-3 font-semibold border border-amber-100">
                    Next patient: {displayList[0]?.patientName || "Not available"}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-[26px] border border-white/70 bg-white/90 backdrop-blur-xl p-4 shadow-[0_25px_60px_-30px_rgba(15,23,42,0.30)]">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-semibold text-slate-700">Upcoming Patients</p>
                  <span className="text-xs text-slate-400">
                    {displayList.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {displayList.slice(0, 5).map((a) => (
                    <div
                      key={`up-${a._id}`}
                      className="flex items-center gap-3 rounded-[20px] border border-slate-200 bg-white px-3 py-3 hover:shadow-sm transition"
                    >
                      <div className="relative">
                        <div
                          className={`p-[2.5px] rounded-full bg-gradient-to-br ${getAvatarRingClass(
                            a?.patientName || a?._id || "upcoming"
                          )}`}
                        >
                          <img
                            src={getPatientPhoto(a)}
                            alt={a.patientName || "Patient"}
                            className="w-10 h-10 rounded-full object-cover border-2 border-white bg-white"
                          />
                        </div>
                        <span className="absolute -right-0.5 bottom-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700 truncate">
                          {a.patientName || "Unknown patient"}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {a.department || "Consultation"}
                        </p>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {a.timeSlot || "--"}
                      </span>
                    </div>
                  ))}
                  {displayList.length === 0 && (
                    <div className="text-sm text-slate-400 py-8 text-center rounded-2xl border border-dashed border-slate-200">
                      No upcoming patients
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[26px] border border-white/70 bg-white/90 backdrop-blur-xl p-4 shadow-[0_25px_60px_-30px_rgba(15,23,42,0.30)]">
                <p className="font-semibold text-slate-700 mb-4">Care Focus</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[20px] p-4 bg-rose-50 border border-rose-100 shadow-sm">
                    <p className="text-xs text-rose-500">Cardio</p>
                    <p className="text-xl font-bold text-rose-700 mt-1">12</p>
                  </div>
                  <div className="rounded-[20px] p-4 bg-violet-50 border border-violet-100 shadow-sm">
                    <p className="text-xs text-violet-500">General</p>
                    <p className="text-xl font-bold text-violet-700 mt-1">9</p>
                  </div>
                  <div className="rounded-[20px] p-4 bg-blue-50 border border-blue-100 shadow-sm">
                    <p className="text-xs text-blue-500">Follow-up</p>
                    <p className="text-xl font-bold text-blue-700 mt-1">7</p>
                  </div>
                  <div className="rounded-[20px] p-4 bg-emerald-50 border border-emerald-100 shadow-sm">
                    <p className="text-xs text-emerald-500">Completed</p>
                    <p className="text-xl font-bold text-emerald-700 mt-1">
                      {appointments.filter((a) => a.status === "accepted").length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="xl:col-span-4 space-y-4">
            <div className="rounded-[26px] border border-white/70 bg-white/90 backdrop-blur-xl p-4 shadow-[0_25px_60px_-30px_rgba(15,23,42,0.30)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800 text-lg">Calendar</p>
                  <span className="text-xs text-slate-400">
                    {new Date().toLocaleString("default", { month: "long" })} {new Date().getFullYear()}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600">
                  <CalendarDays size={18} />
                </div>
              </div>
            </div>

            <div className="rounded-[26px] border border-white/70 bg-white/95 backdrop-blur-xl p-3 shadow-[0_25px_60px_-30px_rgba(15,23,42,0.30)]">
              <RealCalendar />
            </div>

            <div className="rounded-[26px] border border-white/70 bg-white/90 backdrop-blur-xl p-4 shadow-[0_25px_60px_-30px_rgba(15,23,42,0.30)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold text-slate-800">Today Schedule</p>
                  <span className="text-xs text-slate-400">
                    {todayList.length} appointments
                  </span>
                </div>
                <div className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-semibold">
                  Live list
                </div>
              </div>

              <div className="space-y-2.5 max-h-[420px] overflow-auto pr-1">
                {todayList.length === 0 ? (
                  <div className="text-slate-400 text-sm py-8 text-center rounded-2xl border border-dashed border-slate-200">
                    No appointments today
                  </div>
                ) : (
                  todayList.map((a) => {
                    const cfg = getTypeConfig(a.department);
                    const Icon = cfg.icon;
                    return (
                      <div
                        key={a._id}
                        className="rounded-[20px] border border-slate-200 bg-white p-3 hover:shadow-sm transition"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center ${cfg.color} shadow-sm`}
                          >
                            <Icon size={15} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-700 truncate">
                              {a.department || "Consultation"}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">
                              {a.patientName || "--"}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400 mb-1" />
                            <p className="text-[11px] font-semibold text-slate-500">
                              {a.timeSlot || "--"}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}