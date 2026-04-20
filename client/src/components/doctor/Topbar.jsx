import { Bell } from "lucide-react";

export default function Topbar() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const getStoredUser = () => {
    try {
      const persistence = localStorage.getItem("authPersistence");
      if (persistence === "local") return JSON.parse(localStorage.getItem("user")) || {};
      return JSON.parse(sessionStorage.getItem("user")) || JSON.parse(localStorage.getItem("user")) || {};
    } catch { return {}; }
  };
  const user = getStoredUser();
  const firstName = user?.name?.split(" ")[0] || "Doctor";

  return (
    <div className="bg-white/90 backdrop-blur border border-slate-200 rounded-2xl px-4 py-3 flex justify-between items-center mb-6 shadow-sm">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            {greeting}, Dr. {firstName}!
          </h1>
          <span className="text-xl">👋</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long", month: "long", day: "numeric"
          })}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Bell */}
        <button className="relative w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-all">
          <Bell size={15} className="text-slate-500" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
        </button>

        {/* Avatar */}
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-blue-500/30">
          {user?.name?.charAt(0)?.toUpperCase() || "D"}
        </div>
      </div>
    </div>
  );
}