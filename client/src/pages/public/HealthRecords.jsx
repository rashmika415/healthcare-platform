import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PublicNavbar from "../../components/PublicNavbar";

export default function HealthRecords() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const goToMyRecords = () => {
    if (!user) return navigate("/login");
    if (user.role === "patient") return navigate("/patient/reports");
    if (user.role === "doctor") return navigate("/doctor/dashboard");
    if (user.role === "admin") return navigate("/admin/dashboard");
    return navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PublicNavbar />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_15%_20%,rgba(147,197,253,0.35),transparent_38%),radial-gradient(circle_at_88%_14%,rgba(30,64,175,0.2),transparent_30%)]" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <div className="relative flex items-start sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Health Records
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Your clinical history, unified in one place
            </h1>
            <p className="text-sm text-slate-500 mt-2 max-w-2xl">
              Manage reports, prescriptions, and visit history with secure access controls tailored to your role.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/"
              className="px-4 py-2 rounded-xl bg-white/80 backdrop-blur border border-blue-900/10 text-sm font-semibold text-slate-700 hover:bg-white transition"
            >
              Back to Home
            </Link>
          </div>
        </div>

        <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-2xl border border-blue-900/10 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.45)] p-6">
            <p className="text-sm font-extrabold text-slate-800">What you can do</p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: "Upload reports", desc: "Store lab results and documents securely for quick access." },
                { title: "Track prescriptions", desc: "Keep medication history organized and searchable." },
                { title: "Share with doctors", desc: "Enable continuity of care by sharing relevant records." },
                { title: "Audit-friendly access", desc: "Access is restricted by roles and authenticated sessions." }
              ].map((c) => (
                <div key={c.title} className="rounded-2xl border border-slate-100 bg-white p-4">
                  <p className="text-sm font-extrabold text-slate-800">{c.title}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{c.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              <div className="font-extrabold mb-1">Privacy note</div>
              <div className="text-xs font-semibold text-blue-800 opacity-90 leading-relaxed">
                Health records require login. Guests can browse doctors and view availability, but records are always protected.
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-blue-900/10 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.45)] p-6">
            <p className="text-sm font-extrabold text-slate-800 mb-2">Continue</p>
            <p className="text-xs text-slate-500 mb-4">
              {user ? (
                <>
                  Signed in as <span className="font-semibold text-slate-700">{user.email}</span>{" "}
                  <span className="text-slate-400">({user.role})</span>.
                </>
              ) : (
                <>Sign in to access your records and documents.</>
              )}
            </p>

            <button
              type="button"
              onClick={goToMyRecords}
              className="w-full bg-[#001836] bg-gradient-to-br from-[#001836] to-[#002d5b] text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-transform"
            >
              {user ? "Open My Records" : "Login to View Records"}
            </button>

            {!user && (
              <div className="mt-3">
                <Link
                  to="/register"
                  className="block text-center px-6 py-2.5 rounded-xl bg-white/80 border border-blue-900/10 text-sm font-bold text-slate-700 hover:bg-white transition"
                >
                  Create Account
                </Link>
              </div>
            )}

            <div className="mt-5 text-[11px] text-slate-400 leading-relaxed">
              Patients manage reports and prescriptions. Doctors access patient context through appointments and clinical workflows.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

