import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PublicNavbar from "../../components/PublicNavbar";

export default function Telemedicine() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const primaryCta = () => {
    if (!user) return navigate("/login");
    // All roles can open hub, but private routing will enforce auth.
    return navigate("/video/hub");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PublicNavbar />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_15%_20%,rgba(147,197,253,0.35),transparent_38%),radial-gradient(circle_at_88%_14%,rgba(30,64,175,0.2),transparent_30%)]" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <div className="relative flex items-start sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Telemedicine
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Secure video consultations, built into your care journey
            </h1>
            <p className="text-sm text-slate-500 mt-2 max-w-2xl">
              Create an appointment, then join the consultation from your dashboard. Sessions are protected and tied to your appointment.
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
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center">
                VC
              </div>
              <div className="min-w-0">
                <p className="text-base font-extrabold text-slate-900">How it works</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  <li className="flex gap-2">
                    <span className="mt-1 w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                    Book an appointment session with a verified doctor.
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                    On the appointment time, open the consultation hub.
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                    Join the call with end-to-end session authorization.
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: "Encrypted access", desc: "Only authenticated users can join sessions tied to their appointments." },
                { title: "Low-friction join", desc: "One-click join from your dashboard when your session is active." },
                { title: "Care continuity", desc: "Consultations are designed to pair with prescriptions and follow-ups." },
                { title: "Works on mobile", desc: "Responsive layout supports phone and desktop experiences." }
              ].map((c) => (
                <div key={c.title} className="rounded-2xl border border-slate-100 bg-white p-4">
                  <p className="text-sm font-extrabold text-slate-800">{c.title}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-blue-900/10 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.45)] p-6">
            <p className="text-sm font-extrabold text-slate-800 mb-2">Get started</p>
            <p className="text-xs text-slate-500 mb-4">
              {user ? (
                <>Signed in as <span className="font-semibold text-slate-700">{user.email}</span>.</>
              ) : (
                <>You’re not signed in. Login to access consultations.</>
              )}
            </p>

            <button
              type="button"
              onClick={primaryCta}
              className="w-full bg-[#001836] bg-gradient-to-br from-[#001836] to-[#002d5b] text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-transform"
            >
              {user ? "Open Consultation Hub" : "Login to Continue"}
            </button>

            <div className="mt-3 flex flex-col gap-2">
              <Link
                to="/appointments"
                className="w-full text-center px-6 py-2.5 rounded-xl bg-white/80 border border-blue-900/10 text-sm font-bold text-slate-700 hover:bg-white transition"
              >
                Browse Doctors
              </Link>
              <Link
                to="/health-records"
                className="w-full text-center px-6 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 hover:bg-white transition"
              >
                Learn about Health Records
              </Link>
            </div>

            <div className="mt-5 text-[11px] text-slate-400 leading-relaxed">
              Tip: If you’re a patient, you’ll usually start by booking an appointment; if you’re a doctor, you’ll manage sessions from your dashboard.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

