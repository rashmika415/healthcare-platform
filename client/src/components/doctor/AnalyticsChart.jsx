import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-4 py-3">
        <p className="text-xs text-slate-400 mb-1">{label}</p>
        <p className="text-sm font-bold text-blue-600">{payload[0].value} patients</p>
      </div>
    );
  }
  return null;
};

export default function AnalyticsChart({ appointments }) {
  const dataMap = {};
  appointments.forEach(a => {
    const day = new Date(a.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (!dataMap[day]) dataMap[day] = 0;
    dataMap[day]++;
  });

  const data = Object.keys(dataMap).length > 0
    ? Object.keys(dataMap).map(day => ({ name: day, patients: dataMap[day] }))
    : [
        { name: "Mon", patients: 3 },
        { name: "Tue", patients: 7 },
        { name: "Wed", patients: 5 },
        { name: "Thu", patients: 10 },
        { name: "Fri", patients: 8 },
        { name: "Sat", patients: 4 },
        { name: "Sun", patients: 6 },
      ];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
        <defs>
          <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}    />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone" dataKey="patients"
          stroke="#3b82f6" strokeWidth={2.5}
          fill="url(#colorPatients)"
          dot={{ fill: "#3b82f6", r: 3, strokeWidth: 2, stroke: "#fff" }}
          activeDot={{ r: 5, stroke: "#3b82f6", strokeWidth: 2, fill: "#fff" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}