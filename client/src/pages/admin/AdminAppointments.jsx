import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export default function AdminAppointments() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await api.get(`/admin/appointments`);
      setAppointments(res.data?.appointments || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const escapeCsv = (value) => {
    const str = value === null || value === undefined ? "" : String(value);
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  const handleDownloadReport = () => {
    if (!appointments.length) return;

    const headers = [
      "Appointment ID",
      "Patient Name",
      "Patient Email",
      "Patient ID",
      "Doctor Name",
      "Doctor ID",
      "Specialization",
      "Date",
      "Time",
      "Status",
      "Payment Status",
      "Notes",
    ];

    const rows = appointments.map((appointment) => [
      appointment._id,
      appointment.patientName,
      appointment.patientEmail || "N/A",
      appointment.patientId,
      appointment.doctorName,
      appointment.doctorId,
      appointment.specialization,
      appointment.date,
      appointment.time,
      appointment.status || "BOOKED",
      appointment.paymentStatus || "PENDING",
      appointment.notes || "",
    ]);

    const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `appointments-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const badgeStyle = (value) => {
    const text = String(value || "").toLowerCase();

    if (text.includes("complete")) {
      return {
        background: "#dcfce7",
        color: "#166534",
        border: "1px solid #bbf7d0",
      };
    }

    if (text.includes("paid")) {
      return {
        background: "#dbeafe",
        color: "#1d4ed8",
        border: "1px solid #bfdbfe",
      };
    }

    if (text.includes("pending")) {
      return {
        background: "#fef3c7",
        color: "#b45309",
        border: "1px solid #fde68a",
      };
    }

    if (text.includes("cancel")) {
      return {
        background: "#fee2e2",
        color: "#b91c1c",
        border: "1px solid #fecaca",
      };
    }

    return {
      background: "#f1f5f9",
      color: "#334155",
      border: "1px solid #e2e8f0",
    };
  };

  return (
    <div style={s.root}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box}`}</style>

      <aside style={s.sidebar}>
        <div style={s.brand}><span style={s.dot}/>Nexus Health</div>
        <div style={s.adminBadge}>Admin Panel</div>

        <nav style={s.nav}>
          {[
            { label: "Dashboard", path: "/admin/dashboard" },
            { label: "Doctors", path: "/admin/doctors" },
            { label: "Patients", path: "/admin/patients" },
            { label: "Appointments", path: "/admin/appointments" },
            { label: "Video Sessions", path: "/admin/video" },
            { label: "Transactions", path: "/admin/transactions" },
          ].map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={
                item.path === "/admin/appointments"
                  ? { ...s.navItem, ...s.activeNavItem }
                  : s.navItem
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button onClick={handleLogout} style={s.logoutBtn}>← Logout</button>
      </aside>

      <main style={s.main}>
        <div style={s.topBar}>
          <h1 style={s.title}>Appointments</h1>
          <div style={s.adminInfo}>
            Logged in as <strong>{user?.name}</strong>
          </div>
        </div>

        {loading ? (
          <div style={s.msg}>Loading appointments...</div>
        ) : (
          <div style={s.card}>
            <div style={s.cardHeader}>
              <div style={s.cardHeaderTop}>
                <div>
                  <h2 style={s.cardTitle}>All Appointments</h2>
                  <p style={s.cardSub}>{appointments.length} records found</p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadReport}
                  disabled={!appointments.length}
                  style={{
                    ...s.downloadBtn,
                    ...(appointments.length ? {} : s.downloadBtnDisabled),
                  }}
                >
                  Download Report
                </button>
              </div>
            </div>

            {appointments.length === 0 ? (
              <div style={s.empty}>No appointments found.</div>
            ) : (
              <div style={s.list}>
                {appointments.map((appointment) => (
                  <div key={appointment._id} style={s.item}>
                    <div style={s.itemTop}>
                      <div>
                        <h3 style={s.doctorName}>Dr. {appointment.doctorName}</h3>
                        <p style={s.spec}>{appointment.specialization}</p>
                      </div>

                      <div style={s.badgeGroup}>
                        <span style={{ ...s.badge, ...badgeStyle(appointment.status) }}>
                          {appointment.status || "BOOKED"}
                        </span>
                        <span style={{ ...s.badge, ...badgeStyle(appointment.paymentStatus) }}>
                          {appointment.paymentStatus || "PENDING"}
                        </span>
                      </div>
                    </div>

                    <div style={s.grid}>
                      <div>
                        <p><strong>Patient:</strong> {appointment.patientName}</p>
                        <p><strong>Email:</strong> {appointment.patientEmail || "N/A"}</p>
                        <p><strong>Patient ID:</strong> {appointment.patientId}</p>
                      </div>

                      <div>
                        <p><strong>Doctor ID:</strong> {appointment.doctorId}</p>
                        <p><strong>Date:</strong> {appointment.date}</p>
                        <p><strong>Time:</strong> {appointment.time}</p>
                      </div>

                      <div>
                        <p><strong>Notes:</strong> {appointment.notes || "None"}</p>
                        <p><strong>Appointment ID:</strong> {appointment._id}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

const s = {
  root: { display: "flex", minHeight: "100vh", fontFamily: "'DM Sans',sans-serif", background: "#f4f7fb" },
  sidebar: { width: 220, background: "#1a0533", display: "flex", flexDirection: "column", padding: "24px 0", flexShrink: 0 },
  brand: { display: "flex", alignItems: "center", gap: 8, fontSize: 17, fontWeight: 700, color: "#fff", padding: "0 20px 16px" },
  dot: { width: 9, height: 9, borderRadius: "50%", background: "#a855f7", display: "inline-block" },
  adminBadge: { margin: "0 12px 20px", background: "rgba(168,85,247,0.2)", color: "#d8b4fe", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, textAlign: "center", letterSpacing: 1, textTransform: "uppercase" },
  nav: { flex: 1, padding: "0 12px" },
  navItem: { display: "block", padding: "10px 14px", color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: 13, fontWeight: 500, borderRadius: 8, marginBottom: 2 },
  activeNavItem: { background: "rgba(255,255,255,0.08)", color: "#fff" },
  logoutBtn: { margin: "0 12px 24px", padding: "10px 14px", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 13, textAlign: "left" },
  main: { flex: 1, padding: 36 },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 },
  title: { fontSize: 22, fontWeight: 800, color: "#0b1f3a", margin: 0 },
  adminInfo: { fontSize: 13, color: "#7a92aa" },
  msg: { color: "#7a92aa", fontSize: 14 },
  card: { background: "#fff", borderRadius: 14, border: "1px solid #e4ecf7", overflow: "hidden" },
  cardHeader: { padding: 22, borderBottom: "1px solid #e4ecf7", background: "#f8fbff" },
  cardHeaderTop: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" },
  cardTitle: { margin: 0, fontSize: 20, color: "#0b1f3a" },
  cardSub: { margin: "6px 0 0", fontSize: 13, color: "#7a92aa" },
  downloadBtn: {
    border: "none",
    borderRadius: 10,
    background: "#2563eb",
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    padding: "9px 14px",
    cursor: "pointer",
  },
  downloadBtnDisabled: {
    background: "#93c5fd",
    cursor: "not-allowed",
  },
  empty: { padding: 24, color: "#7a92aa" },
  list: { display: "flex", flexDirection: "column" },
  item: { padding: 22, borderBottom: "1px solid #eef3fa" },
  itemTop: { display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 16 },
  doctorName: { margin: 0, fontSize: 22, color: "#0b1f3a" },
  spec: { margin: "6px 0 0", color: "#64748b", fontSize: 14 },
  badgeGroup: { display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" },
  badge: { padding: "7px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700 },
  grid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, fontSize: 14, color: "#334155" },
};