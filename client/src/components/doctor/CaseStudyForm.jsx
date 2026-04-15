import { useEffect, useRef, useState } from "react";
import api from "../../services/api";
import { CheckCircle, ChevronDown, User, XCircle } from "lucide-react";

export default function CaseStudyForm({ initialValues, onSubmit, onCancel, submitting }) {
  const [patientEmail, setPatientEmail] = useState(initialValues?.patientEmail || "");
  const [patientName, setPatientName] = useState(initialValues?.patientName || "");
  const [title, setTitle] = useState(initialValues?.title || "");
  const [summary, setSummary] = useState(initialValues?.summary || "");
  const [patientEmails, setPatientEmails] = useState([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [message, setMessage] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setPatientEmail(initialValues?.patientEmail || "");
    setPatientName(initialValues?.patientName || "");
    setTitle(initialValues?.title || "");
    setSummary(initialValues?.summary || "");
  }, [initialValues]);

  useEffect(() => {
    const fetchPatientEmails = async () => {
      try {
        setLoadingEmails(true);
        const res = await api.get("/patients/emails");
        setPatientEmails(res.data?.patients || []);
      } catch {
        setPatientEmails([]);
      } finally {
        setLoadingEmails(false);
      }
    };
    fetchPatientEmails();
  }, []);

  useEffect(() => {
    const close = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 2500);
  };

  const submit = async () => {
    const email = String(patientEmail || "").trim().toLowerCase();
    const cleanTitle = String(title || "").trim();
    const cleanSummary = String(summary || "").trim();
    if (!email || !cleanTitle || !cleanSummary) {
      showMessage("error", "Patient email, title and case study are required.");
      return;
    }
    await onSubmit({
      patientEmail: email,
      patientName: String(patientName || "").trim(),
      title: cleanTitle,
      summary: cleanSummary,
    });
    showMessage("success", initialValues?._id ? "Case study updated." : "Case study added.");
  };

  return (
    <div className="space-y-4">
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
              placeholder="Select or type patient email"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button
              type="button"
              onClick={() => setShowDropdown((prev) => !prev)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
            >
              <ChevronDown size={15} className={`transition-transform ${showDropdown ? "rotate-180" : ""}`} />
            </button>
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-52 overflow-auto">
                {loadingEmails ? (
                  <div className="px-3 py-3 text-sm text-slate-500">Loading...</div>
                ) : (
                  patientEmails
                    .filter((p) =>
                      String(p.email || "")
                        .toLowerCase()
                        .includes(String(patientEmail || "").toLowerCase())
                    )
                    .map((p) => (
                      <button
                        key={p.email}
                        type="button"
                        onClick={() => {
                          setPatientEmail(p.email || "");
                          setPatientName(p.name || "");
                          setShowDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                      >
                        <p className="text-sm font-medium text-slate-700">{p.name || "Patient"}</p>
                        <p className="text-xs text-slate-500">{p.email}</p>
                      </button>
                    ))
                )}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1 block">Patient Name</label>
          <div className="relative">
            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Patient name"
              className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-500 mb-1 block">Case Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Post-op cardiac monitoring case"
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-500 mb-1 block">Case Study Details *</label>
        <textarea
          rows={6}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Write case study details..."
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500 resize-none"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-60"
        >
          {submitting ? "Saving..." : initialValues?._id ? "Update Case Study" : "Add Case Study"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
