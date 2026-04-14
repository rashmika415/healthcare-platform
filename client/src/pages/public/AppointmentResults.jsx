import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api";

const toDateKeyLocal = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const formatDateHeading = (key) => {
  const d = new Date(`${key}T00:00:00`);
  if (Number.isNaN(d.getTime())) return key;
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "2-digit", year: "numeric" });
};

const money = (value) => {
  const n = Number(value);
  if (Number.isNaN(n)) return "--";
  return `Rs ${n.toLocaleString()}`;
};

const groupSlotsByDate = (slots) => {
  const map = {};
  (slots || []).forEach((s) => {
    const key = toDateKeyLocal(s?.date);
    if (!key) return;
    if (!map[key]) map[key] = [];
    map[key].push(s);
  });
  Object.keys(map).forEach((k) => {
    map[k].sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
  });
  return map;
};

export default function AppointmentResults() {
  const navigate = useNavigate();
  const location = useLocation();

  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const name = query.get("name") || "";
  const specialization = query.get("specialization") || "";
  const hospital = query.get("hospital") || "";
  const date = query.get("date") || "";

  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [availabilityByDoctorId, setAvailabilityByDoctorId] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        setAvailabilityByDoctorId({});

        const params = new URLSearchParams();
        if (name.trim()) params.set("name", name.trim());
        if (specialization) params.set("specialization", specialization);
        if (hospital) params.set("hospital", hospital);

        const res = await api.get(`/public/doctors?${params.toString()}`);
        const list = res.data?.doctors || [];
        setDoctors(list);

        if (list.length === 0) return;

        // Load availability (public endpoint). If date is set, fetch that date only; else fetch all upcoming.
        const results = await Promise.allSettled(
          list.map(async (d) => {
            const url = date
              ? `/doctor/availability/${d._id}?date=${encodeURIComponent(date)}`
              : `/doctor/availability/${d._id}`;
            const av = await api.get(url);
            return { doctorId: d._id, availability: av.data?.availability || [] };
          })
        );

        const map = {};
        results.forEach((r) => {
          if (r.status === "fulfilled") {
            const active = r.value.availability.filter((s) => s.isActive);
            map[r.value.doctorId] = date ? active.slice().sort((a, b) => (a.startTime || "").localeCompare(b.startTime || "")) : active;
          }
        });
        setAvailabilityByDoctorId(map);
      } catch (e) {
        setError(e.response?.data?.error || "Failed to load search results.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [name, specialization, hospital, date]);

  const dateHeading = date ? formatDateHeading(date) : "";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_15%_20%,rgba(147,197,253,0.35),transparent_38%),radial-gradient(circle_at_88%_14%,rgba(30,64,175,0.2),transparent_30%)]" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-14">
        <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Search results
            </p>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {specialization ? specialization : "Doctors"}{" "}
              <span className="text-slate-400 font-extrabold">•</span>{" "}
              <span className="text-slate-600">{dateHeading || "All upcoming sessions"}</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {name && <>Doctor: <span className="font-semibold text-slate-700">{name}</span>{" "}</>}
              {hospital && <>Hospital: <span className="font-semibold text-slate-700">{hospital}</span></>}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate("/appointments")}
              className="px-4 py-2 rounded-xl bg-white/80 backdrop-blur border border-blue-900/10 text-sm font-semibold text-slate-700 hover:bg-white transition"
            >
              New search
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl border border-blue-900/10 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.45)] overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-blue-900/10 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-800">
              Sessions
              <span className="ml-2 text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-semibold">
                {loading ? "..." : doctors.length}
              </span>
            </p>
            <div className="text-xs text-slate-400">
              Only verified doctors are shown
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-slate-400 text-sm">Loading...</div>
          ) : doctors.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-sm">
              No doctors found for your search.
            </div>
          ) : (
            <div className="p-4 sm:p-6 space-y-6">
              {date && (
                <div className="text-sm font-bold text-slate-700">
                  {formatDateHeading(date)}
                </div>
              )}

              {doctors.map((d) => {
                const slots = availabilityByDoctorId[d._id] || [];
                const byDate = date ? { [date]: slots } : groupSlotsByDate(slots);
                const dateKeys = Object.keys(byDate).sort((a, b) => new Date(a) - new Date(b));

                return (
                  <div key={d._id} className="rounded-2xl border border-blue-900/10 bg-white overflow-hidden">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 sm:p-5 bg-gradient-to-br from-white to-blue-50/40">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center">
                          {(d.name || "D").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-extrabold text-slate-900 truncate">
                            {d.name}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {d.specialization || "Specialist"} {d.hospital ? `• ${d.hospital}` : ""}
                          </p>
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                              {money(d.consultationFee)} • Consultation Fee
                            </span>
                            {d.experience !== undefined && d.experience !== null && (
                              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                                {d.experience} yrs
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end">
                        <Link
                          to={`/doctors/${d._id}`}
                          className="px-4 py-2 rounded-xl bg-white/80 backdrop-blur border border-blue-900/10 text-sm font-bold text-slate-700 hover:bg-white transition"
                        >
                          View Profile
                        </Link>
                      </div>
                    </div>

                    <div className="px-4 sm:px-5 py-4 bg-white">
                      {date && (slots.length === 0) ? (
                        <div className="flex items-center justify-between gap-4 bg-white rounded-xl border border-slate-100 px-4 py-3">
                          <div className="text-xs text-slate-500 font-semibold">
                            No sessions available on {formatDateHeading(date)}
                          </div>
                          <button
                            type="button"
                            disabled
                            className="px-4 py-2 rounded-xl bg-slate-200 text-slate-500 text-xs font-bold"
                          >
                            Session Not Available
                          </button>
                        </div>
                      ) : dateKeys.length === 0 ? (
                        <div className="flex items-center justify-between gap-4 bg-white rounded-xl border border-slate-100 px-4 py-3">
                          <div className="text-xs text-slate-500 font-semibold">
                            No upcoming sessions available.
                          </div>
                          <button
                            type="button"
                            disabled
                            className="px-4 py-2 rounded-xl bg-slate-200 text-slate-500 text-xs font-bold"
                          >
                            Session Not Available
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-5">
                          {dateKeys.map((dk) => (
                            <div key={dk}>
                              {!date && (
                                <div className="text-xs font-extrabold text-slate-700 mb-2 flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                                  {formatDateHeading(dk)}
                                </div>
                              )}
                              <div className="space-y-2">
                                {(byDate[dk] || []).map((s) => (
                                  <div key={s._id} className="flex items-center justify-between gap-4 bg-white rounded-xl border border-blue-900/10 px-4 py-3 hover:shadow-sm transition-shadow">
                                    <div className="min-w-0">
                                      <p className="text-xs font-extrabold text-slate-800">
                                        {s.startTime} - {s.endTime}
                                      </p>
                                      <p className="text-[11px] text-slate-400">
                                        Channeling Fee: {money(d.consultationFee)}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      className="px-4 py-2 rounded-xl bg-[#001836] bg-gradient-to-br from-[#001836] to-[#002d5b] text-white text-xs font-extrabold shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-transform"
                                      onClick={() => {
                                        navigate('/patient/add-appointment', {
                                          state: {
                                            doctorId: d._id,
                                            doctorName: d.name,
                                            specialization: d.specialization,
                                            appointmentDate: s.date,
                                            appointmentTime: s.startTime,
                                          },
                                        });
                                      }}
                                    >
                                      Book
                                    </button>
                                  </div>
                                ))}
                              </div>

                              {/* Keep a "not available" row under the available sessions (real-world cue like screenshot) */}
                              <div className="mt-2 flex items-center justify-between gap-4 bg-white rounded-xl border border-slate-100 px-4 py-3">
                                <div className="text-xs text-slate-500 font-semibold">
                                  Other sessions are not available
                                </div>
                                <button
                                  type="button"
                                  disabled
                                  className="px-4 py-2 rounded-xl bg-slate-200 text-slate-500 text-xs font-bold"
                                >
                                  Session Not Available
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

