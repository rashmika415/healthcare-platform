import { useEffect, useState } from "react";
import api from "../../services/api";

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    const res = await api.get("/doctor/appointments");
    setAppointments(res.data);
  };

  const handleAction = async (id, status) => {
    await api.patch(`/doctor/appointments/${id}`, { status });
    fetchAppointments();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Appointments</h2>

      <div className="grid gap-4">
        {appointments.map((appt) => (
          <div key={appt._id} className="bg-white p-4 rounded shadow">
            
            <h3 className="font-semibold">{appt.patientName}</h3>
            <p>{appt.date} - {appt.time}</p>
            <p>Status: {appt.status}</p>

            {appt.status === "pending" && (
              <div className="mt-3 space-x-2">
                <button
                  onClick={() => handleAction(appt._id, "accepted")}
                  className="bg-green-500 text-white px-3 py-1 rounded"
                >
                  Accept
                </button>

                <button
                  onClick={() => handleAction(appt._id, "rejected")}
                  className="bg-red-500 text-white px-3 py-1 rounded"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}