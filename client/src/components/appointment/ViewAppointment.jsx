import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

/** Strip trailing slash and accidental `/appointments` so env can be service root or full prefix */
function normalizeAppointmentBaseUrl(raw) {
  if (!raw || typeof raw !== "string") return null;
  let s = raw.trim().replace(/\/$/, "");
  if (s.endsWith("/appointments")) {
    s = s.slice(0, -"/appointments".length).replace(/\/$/, "");
  }
  return s || null;
}

function appointmentApiBases() {
  const gatewayBase = normalizeAppointmentBaseUrl(
    process.env.REACT_APP_API_BASE_URL
  );
  const fromEnv = normalizeAppointmentBaseUrl(
    process.env.REACT_APP_APPOINTMENT_URL
  );
  return [
    ...new Set(
      [fromEnv, gatewayBase, "http://localhost:3000"].filter(Boolean)
    ),
  ];
}

function patientIdFromUser(user) {
  if (!user) return "";
  return String(user.id ?? user._id ?? user.userId ?? "");
}

function formatStatus(status) {
  if (!status) return "—";
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtDateTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

function getStatusBadge(status) {
  const normalized = String(status || "").toLowerCase();

  if (normalized.includes("confirm")) {
    return "bg-blue-100 text-blue-700 ring-1 ring-blue-200";
  }
  if (normalized.includes("complete")) {
    return "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200";
  }
  if (normalized.includes("cancel")) {
    return "bg-red-100 text-red-700 ring-1 ring-red-200";
  }
  if (normalized.includes("pending")) {
    return "bg-amber-100 text-amber-700 ring-1 ring-amber-200";
  }
  if (normalized.includes("paid")) {
    return "bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200";
  }
  if (normalized.includes("fail")) {
    return "bg-rose-100 text-rose-700 ring-1 ring-rose-200";
  }

  return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
}

function ViewAppointment() {
  const { user, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const patientId = useMemo(() => patientIdFromUser(user), [user]);

  useEffect(() => {
    if (authLoading) return;

    if (!user || !patientId) {
      setAppointments([]);
      setLoading(false);
      setError(
        user ? null : "Please log in as a patient to see your appointments."
      );
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const idParam = encodeURIComponent(patientId);
    const bases = appointmentApiBases();
    const urls = bases.map((b) => `${b}/appointments/patient/${idParam}`);

    (async () => {
      let lastErr = null;
      for (const url of urls) {
        try {
          const res = await axios.get(url, { timeout: 15000 });
          if (cancelled) return;
          const list = res.data?.appointments;
          const arr = Array.isArray(list) ? list : [];
          setAppointments(arr);
          setError(null);
          return;
        } catch (err) {
          lastErr = err;
        }
      }

      if (cancelled) return;
      const msg =
        lastErr?.response?.data?.message ||
        lastErr?.response?.data?.error ||
        lastErr?.message ||
        "Could not load appointments.";

      setError(msg);
      setAppointments([]);
    })().finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [user, patientId, authLoading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 rounded-3xl border border-blue-100 bg-white/90 p-6 shadow-sm backdrop-blur">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            My Appointments
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            View your appointment history, consultation details, and booking
            records in one place.
          </p>
          <p className="mt-1 text-sm text-blue-600">
            History is ordered with the most recently booked visits first.
          </p>
        </div>

        {/* User Info */}
        {!authLoading && user && (
          <div className="mb-8 rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">
                {user.name?.charAt(0)?.toUpperCase() || "P"}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  Logged in as
                </p>
                <p className="text-lg font-semibold text-slate-900">
                  {user.name || "—"}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl bg-blue-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Name
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {user.name || "—"}
                </p>
              </div>

              <div className="rounded-2xl bg-blue-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Email
                </p>
                <p className="mt-1 break-all font-semibold text-slate-900">
                  {user.email || "—"}
                </p>
              </div>

              <div className="rounded-2xl bg-blue-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Patient ID
                </p>
                <code className="mt-1 inline-block rounded-lg border border-blue-200 bg-white px-3 py-1 text-sm font-semibold text-blue-700">
                  {patientId || "—"}
                </code>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="rounded-3xl border border-blue-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
            <p className="text-sm font-medium text-slate-600">
              Loading your appointment history...
            </p>
          </div>
        ) : !error && appointments.length === 0 ? (
          /* Empty State */
          <div className="rounded-3xl border border-dashed border-blue-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl text-blue-600">
              📅
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              No appointments yet
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              You don’t have any appointment history yet. Book your first visit
              from <span className="font-semibold text-blue-600">Add Appointment</span>.
            </p>
          </div>
        ) : !error ? (
          /* Table */
          <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">
            <div className="border-b border-blue-100 bg-gradient-to-r from-blue-600 to-sky-500 px-6 py-4">
              <h3 className="text-lg font-semibold text-white">
                Appointment History
              </h3>
              <p className="text-sm text-blue-100">
                Review all your booked consultations and payment details.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-slate-700">
                <thead className="bg-blue-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-4 py-4">Appointment Date</th>
                    <th className="px-4 py-4">Time</th>
                    <th className="px-4 py-4">Doctor</th>
                    <th className="px-4 py-4">Specialization</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Payment</th>
                    <th className="px-4 py-4">Notes</th>
                    <th className="px-4 py-4">Booked On</th>
                    <th className="px-4 py-4">Last Updated</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {appointments.map((row, index) => (
                    <tr
                      key={row._id || index}
                      className="transition hover:bg-blue-50/60"
                    >
                      <td className="px-4 py-4 font-medium text-slate-900">
                        {row.date || "—"}
                      </td>
                      <td className="px-4 py-4">{row.time || "—"}</td>
                      <td className="px-4 py-4 font-medium text-slate-900">
                        {row.doctorName || "—"}
                      </td>
                      <td className="px-4 py-4">{row.specialization || "—"}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(
                            row.status
                          )}`}
                        >
                          {formatStatus(row.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(
                            row.paymentStatus
                          )}`}
                        >
                          {formatStatus(row.paymentStatus)}
                        </span>
                      </td>
                      <td className="max-w-[220px] px-4 py-4 text-slate-600">
                        <div className="truncate" title={row.notes || ""}>
                          {row.notes?.trim() ? row.notes : "—"}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500">
                        {fmtDateTime(row.createdAt)}
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500">
                        {fmtDateTime(row.updatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default ViewAppointment;