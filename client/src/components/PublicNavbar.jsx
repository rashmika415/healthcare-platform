import { useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { label: "Home", to: "/" },
  { label: "Appointments", to: "/appointments" },
  { label: "Telemedicine", to: "/telemedicine" },
  { label: "Contact", to: "/contact" },
  { label: "Health Records", to: "/health-records" },
];

export default function PublicNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();

  const profilePath = useMemo(() => {
    if (user?.role === "patient") return "/patient/profile";
    if (user?.role === "doctor") return "/doctor/dashboard";
    if (user?.role === "admin") return "/admin/dashboard";
    return "/";
  }, [user?.role]);

  const getAppointmentsLink = useMemo(() => {
    if (!user) return "/appointments";
    if (user.role === "doctor") return "/doctor/appointments";
    if (user.role === "admin") return "/admin/dashboard";
    return "/appointments";
  }, [user]);

  const resolvedNavItems = useMemo(() => {
    return navItems.map((i) =>
      i.label === "Appointments" ? { ...i, to: getAppointmentsLink } : i
    );
  }, [getAppointmentsLink]);

  const desktopLinkClass = ({ isActive }) =>
    isActive
      ? "text-blue-900 border-b-2 border-blue-900 pb-1"
      : "text-slate-500 hover:text-blue-900 transition-colors";

  const mobileLinkClass = ({ isActive }) =>
    isActive
      ? "block rounded-lg px-3 py-2 bg-blue-50 text-blue-900 font-semibold"
      : "block rounded-lg px-3 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-900 transition-colors";

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/75 backdrop-blur-xl border-b border-blue-900/10 shadow-[0_10px_40px_-20px_rgba(0,24,54,0.25)] font-inter tracking-tight antialiased">
      <div className="flex justify-between items-center h-20 px-4 sm:px-6 lg:px-8 max-w-screen-2xl mx-auto">
        <Link
          to="/"
          className="text-2xl font-headline font-bold tracking-tighter text-blue-950"
          onClick={() => setIsMenuOpen(false)}
        >
          Nexus Health
        </Link>

        <div className="hidden md:flex items-center gap-10">
          {resolvedNavItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.to === "/"}
              className={desktopLinkClass}
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <button
            className="inline-flex md:hidden text-slate-600 hover:text-blue-900 transition-colors"
            aria-label="Toggle navigation menu"
            onClick={() => setIsMenuOpen((prev) => !prev)}
          >
            <span className="material-symbols-outlined">
              {isMenuOpen ? "close" : "menu"}
            </span>
          </button>

          {!user && (
            <>
              <Link
                to="/login"
                className="hidden sm:inline-flex px-4 py-2.5 rounded-md text-sm font-semibold text-blue-900 hover:text-blue-700 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-[#001836] text-white px-4 sm:px-5 py-2.5 rounded-md font-semibold text-sm shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-transform bg-gradient-to-br from-[#001836] to-[#002d5b]"
              >
                Register
              </Link>
            </>
          )}

          {user && (
            <Link
              to={profilePath}
              className="hidden sm:block w-10 h-10 rounded-full bg-surface-container overflow-hidden ring-2 ring-white/70"
              aria-label="Open profile"
              title="Profile"
            >
              <img
                alt="User profile"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBwsl_3uu5TZFBhkTbZ3nBB39Cr406ThQ6xobI6b9Ft6dZrvizZJYsKIXgfylO8437ILfeFPabf4n_R0mmXNBEjhP-VZiJ2gCqnjhsG91UDpGJi9T5r7E9YxYEMmcOHGPvCzD2VT2QvZzO1_9Z4XNTtKovdY9WeXkJbdjlZlfegXccW2ySc_cfAZLezq-wzimMBTZ3vkxXsqgP25i_ZhhsQmoRU9agrxykFX_9ZdzoPyKAGUe_RSImrTu0xMl9VBgOFtcOdi2uAYcM"
                className="w-full h-full object-cover"
              />
            </Link>
          )}
        </div>
      </div>

      <div
        className={`md:hidden px-4 sm:px-6 pb-4 transition-all duration-300 ${
          isMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        <div className="rounded-2xl border border-blue-100 bg-white/95 shadow-lg p-4 space-y-3">
          {resolvedNavItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.to === "/"}
              onClick={() => setIsMenuOpen(false)}
              className={mobileLinkClass}
            >
              {item.label}
            </NavLink>
          ))}

          {!user && (
            <div className="pt-2 flex gap-3">
              <Link
                to="/login"
                onClick={() => setIsMenuOpen(false)}
                className="flex-1 text-center rounded-lg px-3 py-2 border border-blue-200 text-blue-900 font-semibold hover:bg-blue-50 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setIsMenuOpen(false)}
                className="flex-1 text-center rounded-lg px-3 py-2 bg-[#001836] text-white font-semibold bg-gradient-to-br from-[#001836] to-[#002d5b]"
              >
                Register
              </Link>
            </div>
          )}

          {user && (
            <Link
              to={profilePath}
              onClick={() => setIsMenuOpen(false)}
              className="block rounded-lg px-3 py-2 text-center border border-blue-200 text-blue-900 font-semibold hover:bg-blue-50 transition-colors"
            >
              Profile
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

