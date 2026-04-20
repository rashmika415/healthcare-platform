import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import PublicNavbar from "../../components/PublicNavbar";

const money = (value) => {
  const n = Number(value);
  if (Number.isNaN(n)) return "--";
  return `Rs ${n.toLocaleString()}`;
};

const formatDateHeading = (key) => {
  const d = new Date(`${key}T00:00:00`);
  if (Number.isNaN(d.getTime())) return key;
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "2-digit", year: "numeric" });
};

export default function DoctorPublicProfile() {
  const { doctorId } = useParams();
  const [searchParams] = useSearchParams();
  const initialDate = searchParams.get("date") || "";

  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState(null);
  const [date, setDate] = useState(initialDate);
  const [slots, setSlots] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDoctor = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/public/doctors/${doctorId}`);
        setDoctor(res.data?.doctor || null);
      } catch (e) {
        setError(e.response?.data?.error || "Failed to load doctor profile.");
      } finally {
        setLoading(false);
      }
    };
    loadDoctor();
  }, [doctorId]);

  useEffect(() => {
    const loadSlots = async () => {
      try {
        if (!doctorId || !date) {
          setSlots([]);
          return;
        }
        const res = await api.get(`/doctor/availability/${doctorId}?date=${encodeURIComponent(date)}`);
        const list = (res.data?.availability || []).filter((s) => s.isActive);
        list.sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
        setSlots(list);
      } catch {
        setSlots([]);
      }
    };
    loadSlots();
  }, [doctorId, date]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PublicNavbar />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_15%_20%,rgba(147,197,253,0.35),transparent_38%),radial-gradient(circle_at_88%_14%,rgba(30,64,175,0.2),transparent_30%)]" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-14">
        <div className="relative flex items-center justify-between gap-4 mb-5">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Doctor profile
            </p>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {doctor?.name || "Doctor"}
            </h1>
          </div>
          <Link
            to="/appointments"
            className="px-4 py-2 rounded-xl bg-white/80 backdrop-blur border border-blue-900/10 text-sm font-semibold text-slate-700 hover:bg-white transition"
          >
            Back to search
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-10 text-center text-slate-400 text-sm">Loading...</div>
        ) : !doctor ? (
          <div className="p-10 text-center text-slate-400 text-sm">Doctor not found.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-2xl border border-blue-900/10 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.45)] p-5 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-xl">
                  {(doctor.name || "D").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-base font-extrabold text-slate-900 truncate">{doctor.name}</p>
                  <p className="text-sm text-slate-500 truncate">
                    {doctor.specialization || "Specialist"} {doctor.hospital ? `• ${doctor.hospital}` : ""}
                  </p>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                      {money(doctor.consultationFee)} • Consultation Fee
                    </span>
                    {doctor.experience !== undefined && doctor.experience !== null && (
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        {doctor.experience} yrs experience
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  About
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {doctor.bio || "No bio provided yet."}
                </p>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-blue-900/10 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.45)] p-5 sm:p-6">
              <p className="text-sm font-extrabold text-slate-800 mb-3">Available sessions</p>

              <label className="block text-xs font-bold text-slate-500 mb-2">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-transparent transition"
              />

              <div className="mt-4">
                {!date ? (
                  <div className="text-xs text-slate-500 font-semibold bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                    Select a date to view available sessions.
                  </div>
                ) : slots.length === 0 ? (
                  <div className="text-xs text-slate-500 font-semibold bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                    No sessions available for {formatDateHeading(date)}.
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-400 mb-2">{formatDateHeading(date)}</p>
                    {slots.map((s) => (
                      <div key={s._id} className="flex items-center justify-between gap-3 border border-slate-100 rounded-xl px-4 py-3 bg-slate-50/30">
                        <div>
                          <p className="text-xs font-extrabold text-slate-800">
                            {s.startTime} - {s.endTime}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Channeling Fee: {money(doctor.consultationFee)}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="px-4 py-2 rounded-xl bg-[#001836] bg-gradient-to-br from-[#001836] to-[#002d5b] text-white text-xs font-extrabold shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-transform"
                          onClick={() => alert("Booking flow is not implemented yet (appointment-service).")}
                        >
                          Book
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

