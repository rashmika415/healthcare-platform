import { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/doctor/Sidebar";
import PrescriptionForm from "../../components/doctor/PrescriptionForm";
import {
  Plus, Pill, User, Calendar, FileText,
  ChevronDown, ChevronUp, Trash2, CheckCircle,
  Clock, XCircle, Search, Filter,
} from "lucide-react";

const STATUS_CONFIG = {
  active:    { label: "Active",    color: "bg-emerald-100 text-emerald-600", dot: "bg-emerald-500" },
  completed: { label: "Completed", color: "bg-blue-100 text-blue-600",       dot: "bg-blue-500"    },
  cancelled: { label: "Cancelled", color: "bg-rose-100 text-rose-500",       dot: "bg-rose-500"    },
};

const RX_CACHE_PREFIX = "healthcare_doctor_prescriptions_v1:";

function readRxCache(userId) {
  if (userId == null || userId === "") return [];
  try {
    const raw = localStorage.getItem(RX_CACHE_PREFIX + String(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeRxCache(userId, list) {
  if (userId == null || userId === "") return;
  try {
    localStorage.setItem(RX_CACHE_PREFIX + String(userId), JSON.stringify(list));
  } catch {
    /* ignore quota / private mode */
  }
}

function mergePrescriptionsById(server, cached) {
  const map = new Map();
  for (const p of cached || []) {
    if (p?._id) map.set(String(p._id), p);
  }
  for (const p of server || []) {
    if (p?._id) map.set(String(p._id), p);
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );
}

export default function DoctorPrescriptions() {
  const { user } = useAuth();
  const userId = user?.id != null ? String(user.id) : "";

  const [prescriptions, setPrescriptions] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [showForm,      setShowForm]      = useState(false);
  const [expanded,      setExpanded]      = useState(null);
  const [filter,        setFilter]        = useState("all");
  const [search,        setSearch]        = useState("");
  const [message,       setMessage]       = useState(null);

  useEffect(() => {
    fetchPrescriptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch when auth user id is known
  }, [userId]);

  const fetchPrescriptions = async () => {
    const cached = readRxCache(userId);
    try {
      setLoading(true);
      const res = await api.get("/doctor/prescriptions", {
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      });
      const server = res.data.prescriptions || [];
      let merged = mergePrescriptionsById(server, cached);
      if (server.length === 0 && cached.length > 0) {
        merged = cached;
      }
      setPrescriptions(merged);
      if (userId && merged.length) writeRxCache(userId, merged);
    } catch (err) {
      console.error(err);
      if (cached.length > 0) {
        setPrescriptions(cached);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/doctor/prescriptions/${id}/status`, { status });
      fetchPrescriptions();
      setMessage({ type: "success", text: `Marked as ${status}` });
      setTimeout(() => setMessage(null), 2500);
    } catch (err) {
      setMessage({ type: "error", text: "Failed to update status" });
      setTimeout(() => setMessage(null), 2500);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this prescription?")) return;
    try {
      await api.delete(`/doctor/prescriptions/${id}`);
      await fetchPrescriptions();
      setMessage({ type: "success", text: "Prescription deleted" });
      setTimeout(() => setMessage(null), 2500);
    } catch {
      setMessage({ type: "error", text: "Failed to delete" });
      setTimeout(() => setMessage(null), 2500);
    }
  };

  const filtered = prescriptions.filter(p => {
    const matchStatus = filter === "all" || p.status === filter;
    const matchSearch = !search ||
      p.patientName?.toLowerCase().includes(search.toLowerCase()) ||
      p.patientUserId?.toLowerCase().includes(search.toLowerCase()) ||
      p.diagnosis?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const stats = {
    total:     prescriptions.length,
    active:    prescriptions.filter(p => p.status === "active").length,
    completed: prescriptions.filter(p => p.status === "completed").length,
    cancelled: prescriptions.filter(p => p.status === "cancelled").length,
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex-1 p-6 overflow-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Prescriptions</h1>
            <p className="text-sm text-slate-400 mt-0.5">Manage and issue digital prescriptions</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition shadow-lg shadow-blue-500/25"
          >
            <Plus size={15} />
            {showForm ? "Close Form" : "New Prescription"}
          </button>
        </div>

        {/* Global message */}
        {message && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium mb-4 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-rose-50 text-rose-600 border border-rose-200"
          }`}>
            {message.type === "success" ? <CheckCircle size={15}/> : <XCircle size={15}/>}
            {message.text}
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total",     value: stats.total,     color: "blue",    icon: FileText    },
            { label: "Active",    value: stats.active,    color: "emerald", icon: CheckCircle },
            { label: "Completed", value: stats.completed, color: "indigo",  icon: Clock       },
            { label: "Cancelled", value: stats.cancelled, color: "rose",    icon: XCircle     },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-${color}-50 flex items-center justify-center flex-shrink-0`}>
                <Icon size={17} className={`text-${color}-500`} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">{label}</p>
                <p className="text-xl font-bold text-slate-800">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* New Prescription Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                <Pill size={15} className="text-blue-600" />
              </div>
              <h2 className="font-bold text-slate-800">Create New Prescription</h2>
            </div>
            <PrescriptionForm
              onSuccess={async (createdPrescription) => {
                setShowForm(false);
                if (createdPrescription?._id && userId) {
                  const prev = readRxCache(userId);
                  writeRxCache(userId, mergePrescriptionsById([createdPrescription], prev));
                }
                await fetchPrescriptions();
              }}
            />
          </div>
        )}

        {/* Filters + Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Search */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1">
              <Search size={14} className="text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by patient name, ID or diagnosis..."
                className="text-sm outline-none bg-transparent w-full text-slate-600 placeholder-slate-400"
              />
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Filter size={13} className="text-slate-400" />
              {["all", "active", "completed", "cancelled"].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                    filter === f
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Prescriptions List */}
        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-400">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">Loading prescriptions...</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center py-16 text-slate-400">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
              <Pill size={22} className="opacity-40" />
            </div>
            <p className="text-sm font-medium">No prescriptions found</p>
            <p className="text-xs mt-1 text-slate-300">
              {search ? "Try a different search" : "Create your first prescription above"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(p => {
              const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG.active;
              const isExpanded = expanded === p._id;

              return (
                <div key={p._id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  {/* Card Header */}
                  <div
                    className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-50 transition"
                    onClick={() => setExpanded(isExpanded ? null : p._id)}
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-base flex-shrink-0">
                        {p.patientName?.charAt(0)?.toUpperCase() || "P"}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-800">
                            {p.patientName || "Unknown Patient"}
                          </p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${sc.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} inline-block`}/>
                            {sc.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <User size={10}/> {p.patientUserId?.slice(-8) || "--"}
                          </span>
                          {p.diagnosis && (
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <FileText size={10}/> {p.diagnosis}
                            </span>
                          )}
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Calendar size={10}/>
                            {new Date(p.createdAt).toLocaleDateString("en-US", {
                              month: "short", day: "numeric", year: "numeric"
                            })}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Pill size={10}/> {p.medicines?.length} medicine{p.medicines?.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Status actions */}
                      {p.status === "active" && (
                        <>
                          <button
                            onClick={e => { e.stopPropagation(); handleStatusChange(p._id, "completed"); }}
                            className="text-xs px-2.5 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg font-semibold hover:bg-emerald-100 transition"
                          >
                            Complete
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); handleStatusChange(p._id, "cancelled"); }}
                            className="text-xs px-2.5 py-1.5 bg-rose-50 text-rose-500 rounded-lg font-semibold hover:bg-rose-100 transition"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(p._id); }}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-rose-50 flex items-center justify-center transition"
                      >
                        <Trash2 size={13} className="text-slate-400 hover:text-rose-500" />
                      </button>
                      {isExpanded
                        ? <ChevronUp size={16} className="text-slate-400" />
                        : <ChevronDown size={16} className="text-slate-400" />
                      }
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 px-5 py-4 bg-slate-50">
                      {/* Medicines */}
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                        Medicines
                      </p>
                      <div className="space-y-2 mb-4">
                        {p.medicines?.map((med, i) => (
                          <div key={i} className="bg-white rounded-xl px-4 py-3 border border-slate-100 flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Pill size={12} className="text-blue-600" />
                              </div>
                              <p className="text-sm font-bold text-slate-700 truncate">{med.name}</p>
                            </div>
                            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-medium">
                              {med.dosage}
                            </span>
                            <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg font-medium">
                              {med.duration}
                            </span>
                            <span className="text-xs bg-purple-50 text-purple-600 px-2.5 py-1 rounded-lg font-medium">
                              {med.frequency}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Instructions */}
                      {p.instructions && (
                        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">
                            Instructions
                          </p>
                          <p className="text-xs text-amber-700">{p.instructions}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}