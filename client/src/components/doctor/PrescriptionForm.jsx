import { useState, useEffect } from "react";
import api from "../../services/api";

export default function PrescriptionForm({ patientUserId: initialPatientId }) {
  // If a patient ID is passed as prop (from appointments), use it
  const [patientUserId, setPatientUserId] = useState(initialPatientId || "");
  const [medicines, setMedicines] = useState([{ name: "", dosage: "", duration: "" }]);
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);

  // Update patient ID if prop changes (important when modal opens)
  useEffect(() => {
    if (initialPatientId) setPatientUserId(initialPatientId);
  }, [initialPatientId]);

  // ➕ Add medicine row
  const addMedicine = () => {
    setMedicines([...medicines, { name: "", dosage: "", duration: "" }]);
  };

  // ❌ Remove medicine row
  const removeMedicine = (index) => {
    const updated = medicines.filter((_, i) => i !== index);
    setMedicines(updated);
  };

  // ✏️ Handle input change
  const handleChange = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  // 🚀 Submit
  const submitPrescription = async () => {
    if (!patientUserId || medicines.length === 0) {
      alert("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);

      await api.post("/doctor/prescription", {
        patientUserId,
        medicines,
        instructions,
      });

      alert("✅ Prescription sent successfully!");

      // reset form only if standalone (not modal)
      if (!initialPatientId) {
        setPatientUserId("");
      }
      setMedicines([{ name: "", dosage: "", duration: "" }]);
      setInstructions("");

    } catch (err) {
      console.error(err);
      alert("❌ Failed to send prescription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={initialPatientId ? "" : "p-6 bg-gray-100 min-h-screen"}>
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-md p-6">

        {/* HEADER */}
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Create Prescription
        </h2>

        {/* PATIENT ID */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Patient ID
          </label>
          <input
            type="text"
            placeholder="Enter Patient User ID"
            value={patientUserId}
            onChange={(e) => setPatientUserId(e.target.value)}
            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            disabled={!!initialPatientId} // disable if auto-filled from appointment
          />
        </div>

        {/* MEDICINES */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            Medicines
          </h3>

          {medicines.map((med, i) => (
            <div
              key={i}
              className="grid grid-cols-3 gap-3 mb-3 bg-gray-50 p-3 rounded-lg border"
            >
              <input
                type="text"
                placeholder="Medicine Name"
                value={med.name}
                onChange={(e) => handleChange(i, "name", e.target.value)}
                className="border p-2 rounded"
              />
              <input
                type="text"
                placeholder="Dosage (e.g., 1 tablet)"
                value={med.dosage}
                onChange={(e) => handleChange(i, "dosage", e.target.value)}
                className="border p-2 rounded"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Duration (e.g., 5 days)"
                  value={med.duration}
                  onChange={(e) => handleChange(i, "duration", e.target.value)}
                  className="border p-2 rounded w-full"
                />
                {medicines.length > 1 && (
                  <button
                    onClick={() => removeMedicine(i)}
                    className="bg-red-500 text-white px-3 rounded"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}

          <button
            onClick={addMedicine}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-black transition"
          >
            + Add Medicine
          </button>
        </div>

        {/* INSTRUCTIONS */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Instructions
          </label>
          <textarea
            rows="4"
            placeholder="Additional instructions for patient..."
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* SUBMIT BUTTON */}
        <button
          onClick={submitPrescription}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          {loading ? "Sending..." : "Submit Prescription"}
        </button>
      </div>
    </div>
  );
}