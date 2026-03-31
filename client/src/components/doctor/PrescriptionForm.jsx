import { useState, useEffect } from "react";
import api from "../../services/api";
import { Plus, Trash2, Pill, User, FileText, CheckCircle, XCircle, ChevronDown } from "lucide-react";

const FREQUENCIES = ["Once daily", "Twice daily", "Three times daily", "Four times daily", "As needed"];

export default function PrescriptionForm({ patientUserId: initialPatientId, patientName: initialPatientName, onSuccess }) {
  const [patientUserId, setPatientUserId] = useState(initialPatientId || "");
  const [patientName,   setPatientName]   = useState(initialPatientName || "");
  const [diagnosis,     setDiagnosis]     = useState("");
  const [instructions,  setInstructions]  = useState("");
  const [loading,       setLoading]       = useState(false);
  const [message,       setMessage]       = useState(null);

  const [medicines, setMedicines] = useState([
    { name: "", dosage: "", duration: "", frequency: "Once daily" }
  ]);

  useEffect(() => {
    if (initialPatientId)   setPatientUserId(initialPatientId);
    if (initialPatientName) setPatientName(initialPatientName);
  }, [initialPatientId, initialPatientName]);

  const addMedicine = () =>
    setMedicines([...medicines, { name: "", dosage: "", duration: "", frequency: "Once daily" }]);

  const removeMedicine = (i) =>
    setMedicines(medicines.filter((_, idx) => idx !== i));

  const handleMedChange = (i, field, value) => {
    const updated = [...medicines];
    updated[i][field] = value;
    setMedicines(updated);
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3500);
  };

  const handleSubmit = async () => {
    if (!patientUserId) return showMessage("error", "Patient ID is required.");
    for (const m of medicines) {
      if (!m.name || !m.dosage || !m.duration)
        return showMessage("error", "Fill all medicine fields.");
    }
    try {
      setLoading(true);
      const res = await api.post("/doctor/prescriptions", {
        patientUserId,
        patientName,
        medicines,
        instructions,
        diagnosis,
      });
      // Backend returns `{ prescription }`; keep UI resilient to future response shapes.
      const createdPrescription = res?.data?.prescription ?? res?.data;
      showMessage("success", "Prescription sent successfully!");
      // Reset
      if (!initialPatientId) setPatientUserId("");
      setPatientName("");
      setDiagnosis("");
      setInstructions("");
      setMedicines([{ name: "", dosage: "", duration: "", frequency: "Once daily" }]);
      if (onSuccess) onSuccess(createdPrescription);
    } catch (err) {
      showMessage("error", err.response?.data?.error || "Failed to send prescription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">

      {/* Message */}
      {message && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
          message.type === "success"
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : "bg-rose-50 text-rose-600 border border-rose-200"
        }`}>
          {message.type === "success" ? <CheckCircle size={15}/> : <XCircle size={15}/>}
          {message.text}
        </div>
      )}

      {/* Patient Info */}
      <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <User size={12}/> Patient Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Patient ID *</label>
            <input
              type="text"
              value={patientUserId}
              onChange={e => setPatientUserId(e.target.value)}
              disabled={!!initialPatientId}
              placeholder="Enter Patient User ID"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Patient Name</label>
            <input
              type="text"
              value={patientName}
              onChange={e => setPatientName(e.target.value)}
              disabled={!!initialPatientName}
              placeholder="Patient full name"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1 block">Diagnosis</label>
          <input
            type="text"
            value={diagnosis}
            onChange={e => setDiagnosis(e.target.value)}
            placeholder="e.g. Hypertension, Type 2 Diabetes"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>
      </div>

      {/* Medicines */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Pill size={12}/> Medicines
          </h3>
          <button
            onClick={addMedicine}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
          >
            <Plus size={13}/> Add Medicine
          </button>
        </div>

        <div className="space-y-3">
          {medicines.map((med, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
                  Medicine {i + 1}
                </span>
                {medicines.length > 1 && (
                  <button
                    onClick={() => removeMedicine(i)}
                    className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 flex items-center justify-center transition"
                  >
                    <Trash2 size={13} className="text-rose-500" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Medicine Name *</label>
                  <input
                    type="text"
                    value={med.name}
                    onChange={e => handleMedChange(i, "name", e.target.value)}
                    placeholder="e.g. Amoxicillin 500mg"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Dosage *</label>
                  <input
                    type="text"
                    value={med.dosage}
                    onChange={e => handleMedChange(i, "dosage", e.target.value)}
                    placeholder="e.g. 1 tablet"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Duration *</label>
                  <input
                    type="text"
                    value={med.duration}
                    onChange={e => handleMedChange(i, "duration", e.target.value)}
                    placeholder="e.g. 7 days"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Frequency</label>
                  <div className="relative">
                    <select
                      value={med.frequency}
                      onChange={e => handleMedChange(i, "frequency", e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white transition"
                    >
                      {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
          <FileText size={12}/> Instructions
        </h3>
        <textarea
          rows={3}
          value={instructions}
          onChange={e => setInstructions(e.target.value)}
          placeholder="Additional instructions for patient (e.g. take after meals, avoid alcohol...)"
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition"
        />
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 rounded-xl text-sm font-bold hover:opacity-90 active:scale-[0.99] transition-all shadow-lg shadow-blue-500/25 disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
        {loading ? "Sending..." : "Submit Prescription"}
      </button>
    </div>
  );
}