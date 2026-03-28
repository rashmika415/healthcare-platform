import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, CalendarDays, User, Clock,
  BarChart2, FileText, Stethoscope, LogOut,
} from "lucide-react";

export default function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const general = [
    { name: "Dashboard",     path: "/doctor/dashboard",     icon: LayoutDashboard },
    { name: "Appointments",  path: "/doctor/appointments",  icon: CalendarDays    },
    { name: "Reports",       path: "/doctor/reports",       icon: BarChart2       },
  ];

  const manage = [
    { name: "Profile",       path: "/doctor/profile",       icon: User      },
    { name: "Availability",  path: "/doctor/availability",  icon: Clock     },
    { name: "Prescriptions", path: "/doctor/prescriptions", icon: FileText  },
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
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
          ${active
            ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
          }`}
      >
        <Icon size={16} className={active ? "text-white" : "text-slate-400"} />
        {item.name}
      </Link>
    );
  };

  return (
    <div className="w-60 min-h-screen bg-white border-r border-slate-100 flex flex-col p-4 shadow-sm">

      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8 px-1 pt-2">
        <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Stethoscope size={17} className="text-white" />
        </div>
        <div>
          <span className="text-base font-bold text-slate-800 tracking-tight">MediCare</span>
          <p className="text-[10px] text-slate-400 font-medium">Doctor Portal</p>
        </div>
      </div>

      {/* General */}
      <div className="mb-5">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
          General
        </p>
        <div className="space-y-0.5">
          {general.map(item => <NavItem key={item.path} item={item} />)}
        </div>
      </div>

      {/* Manage */}
      <div className="mb-5">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
          Manage
        </p>
        <div className="space-y-0.5">
          {manage.map(item => <NavItem key={item.path} item={item} />)}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto border-t border-slate-100 pt-4 space-y-2">
        {/* User info */}
        <div className="flex items-center gap-3 px-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm border border-blue-100 flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || "D"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-700 truncate">{user?.name || "Doctor"}</p>
            <p className="text-[11px] text-slate-400 truncate">{user?.email || ""}</p>
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
        >
          <LogOut size={16} className="text-red-400 group-hover:text-red-500" />
          Logout
        </button>
      </div>
    </div>
  );
}