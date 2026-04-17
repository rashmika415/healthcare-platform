import { useState, useEffect, useRef } from "react";
import api from "../../services/api";
import { Plus, Trash2, Pill, User, FileText, CheckCircle, XCircle, ChevronDown, Sparkles } from "lucide-react";

const FREQUENCIES = ["Once daily", "Twice daily", "Three times daily", "Four times daily", "As needed"];

export default function PrescriptionForm({ patientEmail: initialPatientEmail, patientName: initialPatientName, onSuccess }) {
  const [patientEmail, setPatientEmail] = useState(initialPatientEmail || "");
  const [patientName, setPatientName] = useState(initialPatientName || "");
  const [diagnosis, setDiagnosis] = useState("");
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [patientEmails, setPatientEmails] = useState([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const [medicines, setMedicines] = useState([
    { name: "", dosage: "", duration: "", frequency: "Once daily" }
  ]);

  useEffect(() => {
    if (initialPatientEmail) setPatientEmail(initialPatientEmail);
    if (initialPatientName) setPatientName(initialPatientName);
  }, [initialPatientEmail, initialPatientName]);

  useEffect(() => {
    fetchPatientEmails();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchPatientEmails = async () => {
    try {
      setLoadingEmails(true);
      const res = await api.get("/patients/emails");
      setPatientEmails(res.data.patients || []);
    } catch (err) {
      console.error("Failed to fetch patient emails:", err);
    } finally {
      setLoadingEmails(false);
    }
  };

  const handleEmailSelect = (email, name) => {
    setPatientEmail(email);
    setPatientName(name);
    setShowDropdown(false);
  };

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

  const handleGenerateAISuggestion = async () => {
    if (!diagnosis.trim()) {
      return showMessage("error", "Diagnosis is required for AI suggestion.");
    }

    try {
      setAiLoading(true);

      const res = await api.post("/doctor/prescriptions/ai-suggest", {
        patientEmail,
        patientName,
        diagnosis,
      });

      const data = res?.data || {};
      console.log("AI response:", data);

      let suggestedMedicines = [];

      if (Array.isArray(data.medicines) && data.medicines.length > 0) {
        suggestedMedicines = data.medicines;
      } else if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        suggestedMedicines = data.suggestions;
      } else if (data.medicine) {
        suggestedMedicines = [
          {
            name: data.medicine || "",
            dosage: data.dosage || "",
            duration: data.duration || "",
            frequency: data.frequency || "Once daily",
          },
        ];
      }

      const cleanedMedicines = suggestedMedicines
        .map((m) => ({
          name: m?.name ? String(m.name).trim() : "",
          dosage: m?.dosage ? String(m.dosage).trim() : "",
          duration: m?.duration ? String(m.duration).trim() : "",
          frequency: FREQUENCIES.includes(String(m?.frequency || "").trim())
            ? String(m.frequency).trim()
            : "Once daily",
        }))
        .filter((m) => m.name || m.dosage || m.duration);

      if (cleanedMedicines.length === 0) {
        return showMessage("error", "AI returned no medicine suggestions.");
      }

      setMedicines(cleanedMedicines);

      if (typeof data.instructions === "string" && data.instructions.trim()) {
        setInstructions(data.instructions.trim());
      } else if (typeof data.note === "string" && data.note.trim()) {
        setInstructions(data.note.trim());
      } else if (typeof data.notes === "string" && data.notes.trim()) {
        setInstructions(data.notes.trim());
      }

      showMessage("success", "AI suggestion generated successfully!");
    } catch (err) {
      console.error("AI suggestion failed:", err);
      const backendError = err.response?.data?.error || err.response?.data?.message;
      if (!err.response) {
        return showMessage("error", err.message || "Network error. Please start the backend.");
      }
      showMessage("error", backendError || "Failed to generate AI suggestion.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!patientEmail) return showMessage("error", "Patient email is required.");
    for (const m of medicines) {
      if (!m.name || !m.dosage || !m.duration)
        return showMessage("error", "Fill all medicine fields.");
    }
    try {
      setLoading(true);
      const res = await api.post("/doctor/prescriptions", {
        patientEmail,
        patientName,
        medicines,
        instructions,
        diagnosis,
      });
      const createdPrescription = res?.data?.prescription ?? res?.data;
      showMessage("success", "Prescription sent successfully!");
      if (!initialPatientEmail) setPatientEmail("");
      setPatientName("");
      setDiagnosis("");
      setInstructions("");
      setMedicines([{ name: "", dosage: "", duration: "", frequency: "Once daily" }]);
      if (onSuccess) onSuccess(createdPrescription);
    } catch (err) {
      console.error("Create prescription failed:", err);
      const status = err.response?.status;
      const data = err.response?.data;
      const backendError = data?.error || data?.message;
      const backendDetails = data?.details;

      if (typeof backendError === "string" && /patientuser(id)?\s+and\s+medicines\s+are\s+required/i.test(backendError)) {
        return showMessage("error", "Failed to send prescription.");
      }

      if (!err.response) {
        return showMessage("error", err.message || "Network error. Please start the backend.");
      }

      if (backendError && backendDetails) {
        return showMessage("error", `${backendError} (${backendDetails})`);
      }
      showMessage("error", backendError || `Request failed (${status})`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">

      {message && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-rose-50 text-rose-600 border border-rose-200"
          }`}
        >
          {message.type === "success" ? <CheckCircle size={15} /> : <XCircle size={15} />}
          {message.text}
        </div>
      )}

      <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <User size={12} /> Patient Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Patient Email *</label>
            <div className="relative" ref={dropdownRef}>
              <input
                type="email"
                value={patientEmail}
                onChange={(e) => {
                  setPatientEmail(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                disabled={!!initialPatientEmail}
                placeholder="Enter patient email address or select from dropdown"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition"
              />
              {!initialPatientEmail && (
                <button
                  type="button"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition"
                >
                  <ChevronDown size={16} className={`transition-transform ${showDropdown ? "rotate-180" : ""}`} />
                </button>
              )}

              {showDropdown && !initialPatientEmail && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto">
                  {loadingEmails ? (
                    <div className="px-3 py-4 text-center text-sm text-slate-500">
                      Loading patient emails...
                    </div>
                  ) : patientEmails.length === 0 ? (
                    <div className="px-3 py-4 text-center text-sm text-slate-500">
                      No patients found
                    </div>
                  ) : (
                    patientEmails
                      .filter(
                        (patient) =>
                          patient.email.toLowerCase().includes(patientEmail.toLowerCase()) ||
                          patient.name.toLowerCase().includes(patientEmail.toLowerCase())
                      )
                      .map((patient, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleEmailSelect(patient.email, patient.name)}
                          className="w-full px-3 py-2.5 text-left hover:bg-slate-50 transition text-sm border-b border-slate-100 last:border-b-0"
                        >
                          <div className="font-medium text-slate-800">{patient.name}</div>
                          <div className="text-slate-500">{patient.email}</div>
                        </button>
                      ))
                  )}
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Patient Name</label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
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
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="e.g. Hypertension, Type 2 Diabetes"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />

          <div className="mt-3">
            <button
              type="button"
              onClick={handleGenerateAISuggestion}
              disabled={aiLoading || !diagnosis.trim()}
              className="inline-flex items-center gap-2 bg-violet-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {aiLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles size={16} />
              )}
              {aiLoading ? "Generating..." : "Generate AI Suggestion"}
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Pill size={12} /> Medicines
          </h3>
          <button
            onClick={addMedicine}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
          >
            <Plus size={13} /> Add Medicine
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
                    onChange={(e) => handleMedChange(i, "name", e.target.value)}
                    placeholder="e.g. Amoxicillin 500mg"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Dosage *</label>
                  <input
                    type="text"
                    value={med.dosage}
                    onChange={(e) => handleMedChange(i, "dosage", e.target.value)}
                    placeholder="e.g. 1 tablet"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Duration *</label>
                  <input
                    type="text"
                    value={med.duration}
                    onChange={(e) => handleMedChange(i, "duration", e.target.value)}
                    placeholder="e.g. 7 days"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Frequency</label>
                  <div className="relative">
                    <select
                      value={med.frequency}
                      onChange={(e) => handleMedChange(i, "frequency", e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white transition"
                    >
                      {FREQUENCIES.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
          <FileText size={12} /> Instructions
        </h3>
        <textarea
          rows={3}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Additional instructions for patient (e.g. take after meals, avoid alcohol...)"
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition"
        />
      </div>

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