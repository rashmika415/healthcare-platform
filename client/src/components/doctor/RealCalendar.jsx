import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useState, useEffect } from "react";
import API from "../../services/doctorApi";

export default function RealCalendar() {
  const [date, setDate] = useState(new Date());
  const [availability, setAvailability] = useState([]);

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      const res = await API.get("/availability");
      setAvailability(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const todaySlots = availability.filter((a) => {
    if (!a?.date) return false;
    const slotDate = new Date(a.date);
    return !isNaN(slotDate.getTime()) && slotDate.toDateString() === date.toDateString();
  });

  return (
    <div>
      <style>{`
        .react-calendar { border: none !important; width: 100% !important; font-family: inherit !important; }
        .react-calendar__tile { border-radius: 8px !important; font-size: 13px !important; }
        .react-calendar__tile--active { background: #2563eb !important; color: white !important; }
        .react-calendar__tile--now { background: #eff6ff !important; color: #2563eb !important; font-weight: bold; }
        .react-calendar__navigation button { font-weight: 600 !important; font-size: 13px !important; }
        .react-calendar__month-view__weekdays__weekday { font-size: 11px !important; color: #9ca3af !important; }
        .react-calendar__month-view__weekdays__weekday abbr { text-decoration: none !important; }
      `}</style>

      <Calendar onChange={setDate} value={date} />

      <div className="mt-3 border-t pt-3">
        <p className="text-xs text-gray-400 mb-2">
          Selected: {date.toDateString()}
        </p>

        {todaySlots.length === 0 ? (
          <p className="text-xs text-yellow-500 font-medium">No availability data</p>
        ) : (
          todaySlots.map((a) => (
            <div
              key={a._id || `${a.date}-${a.startTime}`}
              className="flex items-center gap-2 text-xs text-green-600 font-medium bg-green-50 rounded-lg px-3 py-2 mb-1"
            >
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              {a.startTime || "--"} - {a.endTime || "--"}
            </div>
          ))
        )}
      </div>
    </div>
  );
}