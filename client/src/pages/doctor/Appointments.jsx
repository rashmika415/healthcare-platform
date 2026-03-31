import { useEffect, useState } from "react";
import api from "../../services/api";
import PrescriptionForm from "../../components/doctor/PrescriptionForm";

const STATUS_STYLES = {
  pending: "bg-yellow-100 text-yellow-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  
  // New states for modal
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    api.get("/doctor/appointments")
      .then(res => setAppointments(res.data || []))
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (id, status) => {
    try {
      const { data } = await api.patch(`/doctor/appointments/${id}`, { status });
      const updated = data?.appointment;
      setAppointments(prev =>
        prev.map(a => (a._id === id ? { ...a, ...(updated || { status }) } : a))
      );
    } catch {
      setError("Action failed");
    }
  };

  const filtered =
    filter === "all"
      ? appointments
      : appointments.filter(a => a.status === filter);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Appointments</h1>
        <p className="text-gray-500 text-sm">Manage your patient bookings</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["all", "pending", "accepted", "rejected"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border 
              ${filter === f
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
              }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Loading / Empty */}
      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-10 text-center rounded-xl shadow">
          <div className="text-4xl mb-3">📅</div>
          <h2 className="font-semibold text-lg text-gray-700">
            No appointments
          </h2>
          <p className="text-gray-400 text-sm">
            You don’t have any {filter} appointments
          </p>
        </div>
      ) : (

        /* Cards */
        <div className="space-y-4">
          {filtered.map(ap => (
            <div
              key={ap._id}
              className="bg-white p-5 rounded-xl shadow-sm border flex justify-between items-start"
            >

              {/* LEFT */}
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                  {ap.patientName?.charAt(0) || "P"}
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800">
                    {ap.patientName}
                  </h3>

                  <p className="text-sm text-gray-500">
                    📅 {ap.date ? new Date(ap.date).toLocaleDateString() : "--"}
                    &nbsp; | &nbsp;
                    🕐 {ap.timeSlot || "--"}
                  </p>

                  {ap.reason && (
                    <p className="text-xs text-gray-400 italic mt-1">
                      "{ap.reason}"
                    </p>
                  )}
                </div>
              </div>

              {/* RIGHT */}
              <div className="flex flex-col items-end gap-3">

                {/* Status */}
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${STATUS_STYLES[ap.status]}`}
                >
                  {ap.status}
                </span>

                {/* Actions */}
                {ap.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(ap._id, "accepted")}
                      className="px-3 py-1 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      Accept
                    </button>

                    <button
                      onClick={() => handleAction(ap._id, "rejected")}
                      className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {/* Add Prescription for accepted */}
                {ap.status === "accepted" && (
                  <div className="flex gap-2">
                    {ap.videoRoomLink && (
                      <a
                        href={ap.videoRoomLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 border border-green-200"
                      >
                        Join Video →
                      </a>
                    )}
                    <button
                      onClick={() => {
                        setSelectedPatient(ap.patientUserId);
                        setShowModal(true);
                      }}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add Prescription
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Prescription */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-black"
            >
              ✕
            </button>

            <PrescriptionForm patientUserId={selectedPatient} />
          </div>
        </div>
      )}
    </div>
  );
}