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

// ── Welcome Banner ─────────────────────────────────────
function WelcomeBanner({ user }) {
  const firstName = user?.name?.split(" ")[0] || "Doctor";

  return (
    <div className="relative bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 rounded-2xl overflow-hidden mb-6 shadow-lg">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-40 w-56 h-56 bg-blue-500/10 rounded-full -translate-y-1/2" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-indigo-400/10 rounded-full translate-y-1/2" />
        <div className="absolute top-1/2 right-20 w-20 h-20 bg-rose-400/10 rounded-full" />
      </div>

      <div className="relative flex items-center justify-between px-7 py-6">
        <div className="flex-1 z-10">
          <h2 className="text-2xl font-bold text-white mb-0.5">
            Good day, Dr. {firstName}!
          </h2>
          <p className="text-slate-400 text-sm mb-5">Have a nice time!</p>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-2.5 w-fit hover:bg-white/15 transition-all cursor-pointer group">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/40 group-hover:scale-110 transition-transform flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M12 15c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v7c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 15 6.7 12H5c0 3.41 2.72 6.23 6 6.72V21h2v-2.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
              </svg>
            </div>
            <div>
              <p className="text-white text-xs font-semibold">
                How can I help you today?
              </p>
              <p className="text-slate-400 text-[11px]">
                Just click and start talking
              </p>
            </div>
          </div>
        </div>

        <div className="relative flex-shrink-0 ml-4 z-10">
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
            <path
              d="M80 132 L100 148 L120 132 L115 122 L100 138 L85 122 Z"
              fill="#e2e8f0"
            />
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
            <rect
              x="110"
              y="127"
              width="26"
              height="32"
              rx="3"
              fill="#f1f5f9"
              stroke="#cbd5e1"
              strokeWidth="1"
            />
            <rect x="117" y="123" width="12" height="8" rx="2" fill="#cbd5e1" />
            <line x1="115" y1="138" x2="131" y2="138" stroke="#94a3b8" strokeWidth="1.5" />
            <line x1="115" y1="143" x2="131" y2="143" stroke="#94a3b8" strokeWidth="1.5" />
            <line x1="115" y1="148" x2="125" y2="148" stroke="#3b82f6" strokeWidth="1.5" />
            <ellipse
              cx="67"
              cy="148"
              rx="11"
              ry="20"
              fill="#f8fafc"
              transform="rotate(-8 67 148)"
            />
            <ellipse
              cx="133"
              cy="148"
              rx="11"
              ry="20"
              fill="#f8fafc"
              transform="rotate(8 133 148)"
            />
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
            <path
              d="M87 83 Q91 80 95 82"
              stroke="#78350f"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M105 82 Q109 80 113 83"
              stroke="#78350f"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M93 99 Q100 105 107 99"
              stroke="#c2410c"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx="84" cy="96" r="5" fill="#fca5a5" opacity="0.45" />
            <circle cx="116" cy="96" r="5" fill="#fca5a5" opacity="0.45" />
            <path
              d="M152 72 C152 69 149 67 147 69 C145 67 142 69 142 72 C142 76 147 81 147 81 C147 81 152 76 152 72Z"
              fill="#f87171"
              opacity="0.95"
            />
            <rect
              x="60"
              y="155"
              width="16"
              height="12"
              rx="3"
              fill="#bfdbfe"
              stroke="#93c5fd"
              strokeWidth="1"
            />
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

// ── Main Dashboard ─────────────────────────────────────
export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [doctorProfileId, setDoctorProfileId] = useState("");
  const [joiningId, setJoiningId]       = useState(null);

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
    try {
      setJoiningId(appointmentId);
      const sessionData = await getOrCreateSessionByAppointment(appointmentId);
      const joinData = await joinSession(sessionData.session.sessionId, sessionData.join.participantToken);

      if (joinData.meeting?.url) {
        window.open(joinData.meeting.url, "_blank");
        toast.success("Consultation room opened!");
      } else {
        throw new Error("No meeting URL received");
      }
    } catch (err) {
      console.error("Video join error:", err);
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
    <div className="flex min-h-screen bg-slate-50">
      <Toaster position="top-center" />
      <Sidebar />

      <div className="flex-1 p-6 overflow-auto">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <div className="xl:col-span-8 space-y-4">
            <WelcomeBanner user={user} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-slate-800 text-xl">
                    Patient&apos;s list
                  </h2>
                  <span className="text-xs font-semibold text-slate-400">
                    {displayList.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {displayList.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 text-sm">
                      No appointments found
                    </div>
                  ) : (
                    displayList.slice(0, 7).map((a) => {
                      const cfg = getTypeConfig(a.department);
                      const Icon = cfg.icon;
                      const isActive = selected?._id === a._id;
                      return (
                        <button
                          key={a._id}
                          onClick={() => setSelected(a)}
                          className={`w-full text-left rounded-2xl px-3 py-2.5 border transition ${
                            isActive
                              ? "bg-slate-50 border-slate-300"
                              : "bg-white border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center ${cfg.color}`}
                              >
                                <Icon size={13} />
                              </div>
                              <span className="absolute -right-1 -bottom-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-slate-700">
                                {a.department || "Consultation"}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {a.patientName || "Unknown patient"}
                              </p>
                            </div>
                            <span className="text-xs font-semibold text-slate-500">
                              {a.timeSlot || "--"}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                {selected ? (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative">
                        <div className="p-[2px] rounded-full bg-gradient-to-br from-fuchsia-400 via-cyan-400 to-blue-500">
                          <img
                            src={getPatientPhoto(selected)}
                            alt={selected.patientName || "Patient"}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white"
                          />
                        </div>
                        <span className="absolute -right-1 bottom-0 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-white" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">
                          {selected.patientName || "Patient"}
                        </p>
                        <p className="text-xs text-slate-400">
                          Reservation #{selected._id?.slice(-8)}
                        </p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-xs text-slate-400 mb-1">Complaint</p>
                      <div className="flex flex-wrap gap-1.5">
                        {String(selected.reason || "General check")
                          .split(",")
                          .slice(0, 3)
                          .map((r, i) => (
                            <span
                              key={i}
                              className="text-[11px] px-2 py-1 rounded-lg bg-slate-100 text-slate-600"
                            >
                              {r.trim()}
                            </span>
                          ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 mb-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Date</span>
                        <span className="font-medium text-slate-700">
                          {selected.date
                            ? new Date(selected.date).toLocaleDateString()
                            : "--"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs mt-2">
                        <span className="text-slate-400">Time</span>
                        <span className="font-medium text-slate-700">
                          {selected.timeSlot || "--"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs mt-2">
                        <span className="text-slate-400">Status</span>
                        <span className="font-medium capitalize text-slate-700">
                          {selected.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button className="border border-slate-200 rounded-xl py-2 text-sm font-medium text-slate-700">
                        Edit
                      </button>
                      <button className="rounded-xl py-2 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600">
                        Chat
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="h-full min-h-[220px] flex items-center justify-center text-slate-400">
                    Select a patient
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-5 text-white shadow-lg">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-indigo-100">Video service</p>
                    <h3 className="text-xl font-bold mt-1">
                      Live consultation room
                    </h3>
                    <p className="text-sm text-indigo-100 mt-2">
                      Start secure doctor-patient video chat for instant
                      follow-up.
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <Video size={22} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button className="border border-slate-200 text-slate-600 text-xs font-semibold py-2.5 rounded-xl hover:bg-slate-50 transition">
                    Edit
                  </button>
                  <button 
                    onClick={() => selected?._id && handleJoinCall(selected._id)}
                    disabled={!selected || joiningId === selected._id || String(selected.paymentStatus || '').toLowerCase() === 'completed'}
                    className={`bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs font-semibold py-2.5 rounded-xl hover:opacity-90 transition shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 
                      ${(!selected || joiningId === selected._id || String(selected.paymentStatus || '').toLowerCase() === 'completed') ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {joiningId === (selected?._id) ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Joining...
                      </>
                    ) : (selected && String(selected.paymentStatus || '').toLowerCase() === 'completed') ? (
                      "Consultation Finished"
                    ) : (
                      "Chat"
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <p className="text-xs text-slate-400">Dashboard summary</p>
                <p className="text-lg font-bold text-slate-800 mt-1">
                  Today at a glance
                </p>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="rounded-xl bg-cyan-50 text-cyan-700 px-3 py-2 font-semibold">
                    Total appointments: {appointments.length}
                  </div>
                  <div className="rounded-xl bg-emerald-50 text-emerald-700 px-3 py-2 font-semibold">
                    Today schedule: {todayList.length}
                  </div>
                  <div className="rounded-xl bg-amber-50 text-amber-700 px-3 py-2 font-semibold">
                    Next patient: {displayList[0]?.patientName || "Not available"}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-slate-700">Upcoming Patients</p>
                  <span className="text-xs text-slate-400">
                    {displayList.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {displayList.slice(0, 5).map((a) => (
                    <div
                      key={`up-${a._id}`}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 p-2.5"
                    >
                      <div className="relative">
                        <div className="p-[2px] rounded-full bg-gradient-to-br from-cyan-400 to-violet-500">
                          <img
                            src={getPatientPhoto(a)}
                            alt={a.patientName || "Patient"}
                            className="w-9 h-9 rounded-full object-cover border-2 border-white"
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
                    <div className="text-sm text-slate-400 py-8 text-center">
                      No upcoming patients
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-700 mb-3">Care Focus</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl p-3 bg-rose-50 border border-rose-100">
                    <p className="text-xs text-rose-500">Cardio</p>
                    <p className="text-lg font-bold text-rose-700">12</p>
                  </div>
                  <div className="rounded-xl p-3 bg-violet-50 border border-violet-100">
                    <p className="text-xs text-violet-500">General</p>
                    <p className="text-lg font-bold text-violet-700">9</p>
                  </div>
                  <div className="rounded-xl p-3 bg-blue-50 border border-blue-100">
                    <p className="text-xs text-blue-500">Follow-up</p>
                    <p className="text-lg font-bold text-blue-700">7</p>
                  </div>
                  <div className="rounded-xl p-3 bg-emerald-50 border border-emerald-100">
                    <p className="text-xs text-emerald-500">Completed</p>
                    <p className="text-lg font-bold text-emerald-700">
                      {appointments.filter((a) => a.status === "accepted").length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="xl:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-700">Calendar</p>
              <span className="text-xs text-slate-400">
                {new Date().getFullYear()}
              </span>
            </div>

            <RealCalendar />

            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-slate-700">Today Schedule</p>
                <span className="text-xs text-slate-400">
                  {todayList.length} appointments
                </span>
              </div>

              <div className="space-y-2 max-h-[360px] overflow-auto">
                {todayList.length === 0 ? (
                  <div className="text-slate-400 text-sm py-6 text-center">
                    No appointments today
                  </div>
                ) : (
                  todayList.map((a) => {
                    const cfg = getTypeConfig(a.department);
                    const Icon = cfg.icon;
                    return (
                      <div
                        key={a._id}
                        className="rounded-xl border border-slate-200 p-2.5"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${cfg.color}`}
                          >
                            <Icon size={13} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-700 truncate">
                              {a.department || "Consultation"}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">
                              {a.patientName || "--"}
                            </p>
                          </div>
                          <span className="w-2 h-2 rounded-full bg-cyan-400" />
                          <span className="text-[11px] font-semibold text-slate-500">
                            {a.timeSlot || "--"}
                          </span>
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