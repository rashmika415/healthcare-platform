import { useEffect, useState } from "react";
import api from "../../services/api";
import PrescriptionForm from "../../components/doctor/PrescriptionForm";
import Sidebar from "../../components/doctor/Sidebar";

const STATUS_STYLES = {
  pending: "bg-yellow-100 text-yellow-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [doctorProfileId, setDoctorProfileId] = useState("");
  
  // New states for modal
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showModal, setShowModal] = useState(false);

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

  const doctorIdFromUser = (user) =>
    String(user?.id ?? user?._id ?? user?.userId ?? user?.doctorId ?? "");

  const resolveDoctorProfileId = async () => {
    try {
      const res = await api.get("/doctor/profile");
      const id = String(res.data?._id || "").trim();
      if (id) setDoctorProfileId(id);
      return id || "";
    } catch {
      // Fallback: resolve by email (works even if profile not yet created in current session)
      try {
        const user = getStoredUser();
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
    patientUserId: a.patientUserId || a.patientId,
  });

  const fetchDoctorAppointments = async () => {
    const user = getStoredUser();
    // Booking saves doctorId as Doctor profile _id (not auth user id),
    // so prefer using /doctor/profile._id when available.
    const profileId =
      doctorProfileId || (await resolveDoctorProfileId());
    const doctorId = profileId || doctorIdFromUser(user);
    if (!doctorId) {
      setAppointments([]);
      setLoading(false);
      return;
    }

    // Primary: appointment-service (through gateway) so it matches booking flow.
    try {
      const res = await api.get(`/appointments/doctor/${encodeURIComponent(doctorId)}`);
      const list = Array.isArray(res.data?.appointments) ? res.data.appointments : [];
      setAppointments(list.map(mapAppointment));
      return;
    } catch {
      // Fallback: older doctor-service route (if present in your setup).
      const res = await api.get("/doctor/appointments");
      const list = Array.isArray(res.data) ? res.data : (res.data?.appointments || []);
      setAppointments((Array.isArray(list) ? list : []).map(mapAppointment));
    }
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    fetchDoctorAppointments()
      .catch(() => {
        if (mounted) setAppointments([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const onChanged = () => {
      setLoading(true);
      fetchDoctorAppointments()
        .catch(() => {})
        .finally(() => mounted && setLoading(false));
    };

    // Allow other pages (booking/payment) to trigger refresh by dispatching this event.
    window.addEventListener("appointments:changed", onChanged);
    return () => {
      mounted = false;
      window.removeEventListener("appointments:changed", onChanged);
    };
  }, []);

  const handleAction = async (id, status) => {
    try {
      // Primary: appointment-service update route
      try {
        await api.put(`/appointments/updateappointment/${id}`, { status });
      } catch {
        // Fallback: doctor-service route if configured
        await api.patch(`/doctor/appointments/${id}`, { status });
      }
      setAppointments(prev =>
        prev.map(a => a._id === id ? { ...a, status } : a)
      );
    } catch {
      setError("Action failed");
    }
  };

  const filtered =
    filter === "all"
      ? appointments
      : appointments.filter(a => a.status === filter);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 p-6 overflow-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Appointments</h1>
        <p className="text-sm text-slate-400 mt-0.5">Manage your patient bookings</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-rose-50 text-rose-600 border border-rose-200 p-3 rounded-xl mb-4 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3 mb-4">
        <div className="flex gap-2 flex-wrap">
        {["all", "pending", "accepted", "rejected"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all 
              ${filter === f
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
          >
            {f}
          </button>
        ))}
        </div>
      </div>

      {/* Loading / Empty */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-400">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Loading appointments...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center py-16 text-slate-400">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
            <span className="text-2xl">📅</span>
          </div>
          <h2 className="font-semibold text-base text-slate-700">
            No appointments
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            You don’t have any {filter} appointments
          </p>
        </div>
      ) : (

        /* Cards */
        <div className="space-y-4">
          {filtered.map(ap => (
            <div
              key={ap._id}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex justify-between items-start gap-4"
            >

              {/* LEFT */}
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-100 flex items-center justify-center font-bold text-blue-600 flex-shrink-0">
                  {ap.patientName?.charAt(0) || "P"}
                </div>

                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    {ap.patientName}
                  </h3>

                  <p className="text-xs text-slate-400 mt-0.5">
                    {ap.date ? new Date(ap.date).toLocaleDateString() : "--"} • {ap.timeSlot || "--"}
                  </p>

                  {ap.reason && (
                    <p className="text-xs text-slate-400 italic mt-1">
                      "{ap.reason}"
                    </p>
                  )}
                </div>
              </div>

              {/* RIGHT */}
              <div className="flex flex-col items-end gap-3">

                {/* Status */}
                <span
                  className={`px-3 py-1 text-xs font-bold rounded-full ${STATUS_STYLES[ap.status] || "bg-slate-100 text-slate-600"}`}
                >
                  {ap.status}
                </span>

                {/* Actions */}
                {ap.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(ap._id, "accepted")}
                      className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
                    >
                      Accept
                    </button>

                    <button
                      onClick={() => handleAction(ap._id, "rejected")}
                      className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {/* Add Prescription for accepted */}
                {ap.status === "accepted" && (
                  <button
                    onClick={() => {
                      setSelectedPatient(ap.patientUserId);
                      setShowModal(true);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                  >
                    Add Prescription
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Prescription */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-black"
            >
              ✕
            </button>

            <PrescriptionForm patientUserId={selectedPatient} />
          </div>
        </div>
      )}
      </div>
    </div>
  );
}