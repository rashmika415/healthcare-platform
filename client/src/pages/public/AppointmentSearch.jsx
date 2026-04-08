import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function AppointmentSearch() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ specializations: [], hospitals: [], doctorNames: [] });
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    name: "",
    specialization: "",
    hospital: "",
    date: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/public/filters");
        setFilters(res.data || { specializations: [], hospitals: [], doctorNames: [] });
      } catch (e) {
        setError(e.response?.data?.error || "Failed to load search filters.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();

    const params = new URLSearchParams();
    if (form.name.trim()) params.set("name", form.name.trim());
    if (form.specialization) params.set("specialization", form.specialization);
    if (form.hospital) params.set("hospital", form.hospital);
    if (form.date) params.set("date", form.date);

    navigate(`/appointments/results?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_15%_20%,rgba(147,197,253,0.35),transparent_38%),radial-gradient(circle_at_88%_14%,rgba(30,64,175,0.2),transparent_30%)]" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-14">
        <div className="relative flex items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Appointments
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Find a doctor and book a session
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Search only includes <span className="font-semibold text-slate-700">verified</span> doctors.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-sm font-semibold text-slate-600 hover:text-blue-900 transition-colors"
          >
            Back to Home
          </button>
        </div>

        <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl border border-blue-900/10 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.45)] p-5 sm:p-6">
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-4">
              <label className="block text-xs font-bold text-slate-500 mb-1.5">
                Doctor name
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder={loading ? "Loading..." : "Search Doctor Name"}
                list="doctor-names"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-transparent transition"
              />
              <datalist id="doctor-names">
                {(filters.doctorNames || []).map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-500 mb-1.5">
                Specialization
              </label>
              <select
                value={form.specialization}
                onChange={(e) => setForm((p) => ({ ...p, specialization: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-transparent transition"
              >
                <option value="">Select Specialization</option>
                {(filters.specializations || []).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-500 mb-1.5">
                Hospital
              </label>
              <select
                value={form.hospital}
                onChange={(e) => setForm((p) => ({ ...p, hospital: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-transparent transition"
              >
                <option value="">Select Hospital</option>
                {(filters.hospitals || []).map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-transparent transition"
              />
            </div>

            <div className="md:col-span-12 flex justify-end pt-2">
              <button
                type="submit"
                className="bg-[#001836] bg-gradient-to-br from-[#001836] to-[#002d5b] text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-transform"
              >
                Search
              </button>
            </div>
          </form>

          <div className="mt-5 text-xs text-slate-400">
            Tip: Pick a date only if you want to see available sessions.
          </div>
        </div>
      </div>
    </div>
  );
}

