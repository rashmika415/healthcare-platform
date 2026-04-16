import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import PatientLayout from "../../pages/patient/Patientlayout ";

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
  const fromEnv = normalizeAppointmentBaseUrl(
    process.env.REACT_APP_APPOINTMENT_URL
  );
  return [
    ...new Set(
      [fromEnv, "http://localhost:3000", "http://localhost:3003"].filter(Boolean)
    ),
  ];
}

function notificationApiBase() {
  const fromEnv = process.env.REACT_APP_NOTIFICATION_URL;
  return (fromEnv && fromEnv.trim().replace(/\/$/, "")) || "http://localhost:3005";
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

function AppointmentDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const patientId = useMemo(() => patientIdFromUser(user), [user]);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationError, setNotificationError] = useState(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  useEffect(() => {
    if (authLoading) return;

    if (!user || !patientId) {
      setAppointments([]);
      setLoading(false);
      setError(
        user ? null : "Please log in as a patient to see your appointments."
      );
      setNotifications([]);
      setNotificationsLoading(false);
      setNotificationError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const idParam = encodeURIComponent(patientId);

    const fetchAppointments = async (baseUrl) => {
      try {
        const res = await axios.get(
          `${baseUrl}/appointments/patient/${idParam}`,
          { timeout: 10000 }
        );
        if (res.data?.appointments) {
          return res.data.appointments;
        }
        return [];
      } catch (err) {
        console.warn(`Failed to fetch from ${baseUrl}:`, err.message);
        return null;
      }
    };

    const loadAppointments = async () => {
      const bases = appointmentApiBases();
      for (const base of bases) {
        const result = await fetchAppointments(base);
        if (result !== null) {
          if (!cancelled) {
            setAppointments(result);
            setLoading(false);
          }
          return;
        }
      }

      if (!cancelled) {
        setAppointments([]);
        setError("Unable to load appointments. Please check that the appointment service is running.");
        setLoading(false);
      }
    };

    loadAppointments();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, patientId]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !patientId) {
      setNotifications([]);
      setNotificationsLoading(false);
      setNotificationError(null);
      return;
    }

    let cancelled = false;
    setNotificationsLoading(true);
    setNotificationError(null);

    const loadNotifications = async () => {
      try {
        const res = await axios.get(
          `${notificationApiBase()}/notifications/patient/${encodeURIComponent(patientId)}`,
          { timeout: 10000 }
        );

        if (!cancelled) {
          setNotifications(Array.isArray(res.data) ? res.data : []);
        }
      } catch (err) {
        console.warn("Failed to load notifications:", err.message);
        if (!cancelled) {
          setNotificationError("Unable to load notifications.");
          setNotifications([]);
        }
      } finally {
        if (!cancelled) {
          setNotificationsLoading(false);
        }
      }
    };

    loadNotifications();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, patientId]);

  const handleToggleNotifications = () => {
    setIsNotificationsOpen((current) => !current);
  };

  const handleMarkRead = async (notificationId) => {
    try {
      await axios.put(
        `${notificationApiBase()}/notifications/read/${notificationId}`,
        {},
        { timeout: 10000 }
      );
      setNotifications((current) =>
        current.map((notification) =>
          notification._id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (err) {
      console.warn("Failed to mark notification read:", err.message);
    }
  };

  return (
    <PatientLayout title="Appointments" subtitle="View all your medical appointments">
      <div className="flex flex-col gap-6">
        {loading && (
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200 max-w-5xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-5 bg-slate-200 rounded w-1/3"></div>
              <div className="grid gap-3">
                <div className="h-4 bg-slate-200 rounded"></div>
                <div className="h-4 bg-slate-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-3xl p-6 max-w-5xl mx-auto">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 max-w-5xl mx-auto overflow-hidden">
            <div className="px-8 py-6 bg-slate-50 border-b border-slate-200">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">Your Appointments</h2>
                  <p className="text-slate-500 mt-1">
                    {appointments.length === 0
                      ? "No appointments found."
                      : `${appointments.length} appointment${appointments.length === 1 ? '' : 's'} found.`
                    }
                  </p>
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={handleToggleNotifications}
                    className="relative inline-flex items-center justify-center h-10 w-10 rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
                    aria-label="Notifications"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                      <path d="M12 2a6 6 0 00-6 6v4.586l-.707.707A1 1 0 005 15h14a1 1 0 00.707-1.707L18 12.586V8a6 6 0 00-6-6zm2 16a2 2 0 11-4 0h4z" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold text-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {isNotificationsOpen && (
                    <div className="absolute right-0 z-20 mt-3 w-80 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
                      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">Notifications</p>
                            <p className="text-xs text-slate-500">
                              {notificationsLoading
                                ? 'Loading...'
                                : notificationError
                                ? 'Unable to fetch notifications.'
                                : `${notifications.length} notification${notifications.length === 1 ? '' : 's'}`}
                            </p>
                          </div>
                          {unreadCount > 0 && (
                            <span className="rounded-full bg-rose-500 px-2 py-1 text-[11px] font-semibold text-white">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notificationsLoading ? (
                          <div className="p-4 text-sm text-slate-500">Loading notifications…</div>
                        ) : notificationError ? (
                          <div className="p-4 text-sm text-rose-600">{notificationError}</div>
                        ) : notifications.length === 0 ? (
                          <div className="p-4 text-sm text-slate-500">No notifications yet.</div>
                        ) : (
                          notifications.map((notification) => (
                            <button
                              key={notification._id}
                              type="button"
                              onClick={() => handleMarkRead(notification._id)}
                              className={`w-full text-left px-4 py-4 transition hover:bg-slate-50 ${notification.read ? 'bg-white' : 'bg-slate-50'}`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm text-slate-900">{notification.message}</p>
                                {!notification.read && (
                                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                                )}
                              </div>
                              <p className="mt-1 text-xs text-slate-500">{new Date(notification.createdAt).toLocaleString()}</p>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {appointments.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                You don't have any appointments yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {appointments.map((appointment) => (
                  <div key={appointment._id} className="px-8 py-6 hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <h3 className="font-semibold text-xl text-slate-900 truncate">
                            Dr. {appointment.doctorName}
                          </h3>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(appointment.status)}`}>
                            {formatStatus(appointment.status)}
                          </span>
                          {appointment.paymentStatus && (
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(appointment.paymentStatus)}`}>
                              {formatStatus(appointment.paymentStatus)}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                          <div className="space-y-2">
                            <p>
                              <span className="font-medium text-slate-900">Specialization:</span>{' '}
                              {appointment.specialization}
                            </p>
                            <p>
                              <span className="font-medium text-slate-900">Patient:</span>{' '}
                              {appointment.patientName}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <p>
                              <span className="font-medium text-slate-900">Date & Time:</span>{' '}
                              {fmtDateTime(appointment.date)} {appointment.time}
                            </p>
                            <p>
                              <span className="font-medium text-slate-900">Notes:</span>{' '}
                              {appointment.notes || "None"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </PatientLayout>
  );
}

export default AppointmentDashboard;