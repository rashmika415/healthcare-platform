import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, CalendarDays, User, Clock,
  BarChart2, FileText, Stethoscope, LogOut, ChevronDown,
  FolderClosed, ShieldCheck, FlaskConical,
} from "lucide-react";

export default function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const general = [
    { name: "Dashboard", path: "/doctor/dashboard", icon: LayoutDashboard },
    { name: "Appointments", path: "/doctor/appointments", icon: CalendarDays, badge: "NEW" },
    { name: "Reports", path: "/doctor/reports", icon: BarChart2 },
  ];

  const manage = [
    { name: "Profile", path: "/doctor/profile", icon: User },
    { name: "Availability", path: "/doctor/availability", icon: Clock },
    { name: "Prescriptions", path: "/doctor/prescriptions", icon: FileText },
    { name: "Dosage Guidelines", path: "/doctor/dosage-guidelines", icon: ShieldCheck },
    { name: "Case Studies", path: "/doctor/case-studies", icon: FlaskConical },
  ];
  const database = [
    { name: "Documents", icon: FolderClosed },
    { name: "Dosage Guidelines", path: "/doctor/dosage-guidelines", icon: FileText },
    { name: "Case Study", path: "/doctor/case-studies", icon: FlaskConical },
    { name: "Treatment Protocol", icon: ShieldCheck },
  ];
  const groups = [
    { name: "Operational Staff", color: "bg-fuchsia-400" },
    { name: "Cardiac Surgeons", color: "bg-amber-400" },
  ];

  const getStoredUser = () => {
    try {
      const p = localStorage.getItem("authPersistence");
      if (p === "local") return JSON.parse(localStorage.getItem("user")) || {};
      return JSON.parse(sessionStorage.getItem("user")) || JSON.parse(localStorage.getItem("user")) || {};
    } catch { return {}; }
  };
  const user = getStoredUser();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("authPersistence");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    navigate("/");
  };

  const NavItem = ({ item }) => {
    const Icon = item.icon;
    const active = pathname === item.path;
    return (
      <Link
        to={item.path}
        className={`group flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200
          ${active
            ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/25 text-slate-100 border border-cyan-300/30"
            : "text-slate-300 hover:bg-white/10 hover:text-white border border-transparent"
          }`}
      >
        <Icon size={16} className={active ? "text-cyan-200" : "text-slate-400 group-hover:text-slate-200"} />
        <span>{item.name}</span>
        {item.badge && (
          <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-200 border border-rose-300/30">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="w-64 min-h-screen bg-[#1f2024] border-r border-white/5 flex flex-col p-4">

      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-7 px-1 pt-2">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Stethoscope size={17} className="text-white" />
        </div>
        <div>
          <span className="text-base font-bold text-white tracking-tight">NexusCare</span>
          <p className="text-[10px] text-slate-400 font-medium">Doctor Workspace</p>
        </div>
      </div>
      <div className="mb-4 rounded-xl bg-white/5 border border-white/10 px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-emerald-400/20 border border-emerald-300/40" />
            <p className="text-xs font-semibold text-slate-200">Cardiology</p>
          </div>
          <ChevronDown size={13} className="text-slate-400" />
        </div>
      </div>
      {/* General */}
      <div className="mb-5">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">
          General
        </p>
        <div className="space-y-0.5">
          {general.map(item => <NavItem key={item.path} item={item} />)}
        </div>
      </div>

      {/* Manage */}
      <div className="mb-5">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">
          Manage
        </p>
        <div className="space-y-0.5">
          {manage.map(item => <NavItem key={item.path} item={item} />)}
        </div>
      </div>
      <div className="mb-5">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">
          Database
        </p>
        <div className="space-y-1">
          {database.map((item) => {
            const Icon = item.icon;
            const active = item.path ? pathname === item.path : false;
            const cls = `w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs transition border ${
              active
                ? "text-white bg-white/10 border-white/15"
                : "text-slate-300 hover:bg-white/10 border-transparent"
            }`;
            if (item.path) {
              return (
                <Link key={item.name} to={item.path} className={cls}>
                  <Icon size={14} className={active ? "text-cyan-200" : "text-slate-400"} />
                  {item.name}
                </Link>
              );
            }
            return (
              <button
                key={item.name}
                className={cls}
                type="button"
              >
                <Icon size={14} className="text-slate-400" />
                {item.name}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className="mt-2 w-full flex items-center gap-2 px-3 py-2.5 rounded-2xl text-xs font-semibold text-indigo-200 bg-indigo-500/20 border border-indigo-300/30 hover:bg-indigo-500/30 transition"
        >
          <span className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] text-white">+</span>
          New table
        </button>
      </div>
      <div className="mb-5">
        <button
          type="button"
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs text-slate-200 bg-white/5 border border-white/10 hover:bg-white/10 transition"
        >
          <span>Chat</span>
          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/20 text-rose-200 border border-rose-300/30">
            17
          </span>
        </button>
      </div>
      <div className="mb-5">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">
          Groups
        </p>
        <div className="space-y-2">
          {groups.map((g) => (
            <div key={g.name} className="flex items-center gap-2 px-1">
              <span className={`w-1.5 h-1.5 rounded-full ${g.color}`} />
              <span className="text-xs text-slate-300">{g.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto border-t border-slate-800 pt-4 space-y-2">
        {/* User info */}
        <div className="flex items-center gap-3 px-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm border border-white/10 flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || "D"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-100 truncate">{user?.name || "Doctor"}</p>
            <p className="text-[11px] text-slate-400 truncate">{user?.email || ""}</p>
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-rose-300 hover:bg-rose-500/10 hover:text-rose-200 transition-all duration-200 group"
        >
          <LogOut size={16} className="text-rose-300 group-hover:text-rose-200" />
          Logout
        </button>
      </div>
    </div>
  );
}