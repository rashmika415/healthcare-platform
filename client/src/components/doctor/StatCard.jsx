import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({ title, value, change, icon: Icon, color = "blue" }) {
  const colorMap = {
    blue:   { grad: "from-blue-500 to-blue-600",      shadow: "shadow-blue-500/25"   },
    green:  { grad: "from-emerald-500 to-emerald-600", shadow: "shadow-emerald-500/25" },
    yellow: { grad: "from-amber-400 to-orange-500",   shadow: "shadow-amber-500/25"  },
    red:    { grad: "from-rose-500 to-red-600",       shadow: "shadow-rose-500/25"   },
  };

  const c = colorMap[color] || colorMap.blue;
  const isPositive = change === undefined || change >= 0;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.grad} flex items-center justify-center shadow-lg ${c.shadow} group-hover:scale-110 transition-transform duration-300`}>
            <Icon size={17} className="text-white" />
          </div>
        )}
      </div>

      <h2 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">{value}</h2>

      {change !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-semibold w-fit px-2 py-1 rounded-lg ${
          isPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"
        }`}>
          {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {isPositive ? "+" : ""}{change}% last month
        </div>
      )}
    </div>
  );
}