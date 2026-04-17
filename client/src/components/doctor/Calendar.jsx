export default function Calendar() {
  const days = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border">
      <h3 className="font-semibold mb-3">November 2024</h3>

      <div className="grid grid-cols-7 text-center text-sm mb-2">
        {days.map((d, i) => (
          <div key={i} className="text-gray-500">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="p-2 rounded-lg hover:bg-blue-100 cursor-pointer"
          >
            {i + 1}
          </div>
        ))}
      </div>
    </div>
  );
}