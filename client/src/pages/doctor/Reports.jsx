import { useEffect, useMemo, useState } from "react";
import { CheckCircle, Download, FileText, Search, XCircle } from "lucide-react";
import Sidebar from "../../components/doctor/Sidebar";
import { getDoctorSharedReports, getPatientReportDownloadUrl } from "../../services/patientApi";

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = String(search || "").trim().toLowerCase();
    if (!q) return items;
    return items.filter((x) => {
      const patient = x?.patient || {};
      const report = x?.report || {};
      return (
        String(patient.name || "").toLowerCase().includes(q) ||
        String(patient.email || "").toLowerCase().includes(q) ||
        String(report.title || "").toLowerCase().includes(q) ||
        String(report.reportType || "").toLowerCase().includes(q)
      );
    });
  }, [items, search]);

  const fetchSharedReports = async () => {
    try {
      setLoading(true);
      const data = await getDoctorSharedReports();
      setItems(data?.reports || []);
    } catch (err) {
      console.error("Fetch shared reports failed:", err);
      setMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to load shared reports",
      });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSharedReports();
  }, []);

  const openReport = async (reportId) => {
    try {
      const data = await getPatientReportDownloadUrl(reportId, "view");
      const url = data?.downloadUrl;
      if (!url) throw new Error("No downloadUrl returned");
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Open report failed:", err);
      setMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to open report",
      });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const downloadReport = async (reportId) => {
    try {
      const data = await getPatientReportDownloadUrl(reportId, "download");
      const url = data?.downloadUrl;
      if (!url) throw new Error("No downloadUrl returned");
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Download report failed:", err);
      setMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to download report",
      });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Reports</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Reports shared by your patients
            </p>
          </div>
          <button
            onClick={fetchSharedReports}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            Refresh
          </button>
        </div>

        {message && (
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium mb-4 ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-rose-50 text-rose-600 border border-rose-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle size={15} />
            ) : (
              <XCircle size={15} />
            )}
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-4">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <Search size={14} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by patient, email, report title, or type..."
              className="text-sm outline-none bg-transparent w-full text-slate-600 placeholder-slate-400"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-400">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">Loading shared reports...</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center py-16 text-slate-400">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
              <FileText size={22} className="opacity-40" />
            </div>
            <p className="text-sm font-medium">No shared reports found</p>
            <p className="text-xs mt-1 text-slate-300">
              Ask the patient to share a report to you
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((x, idx) => {
              const patient = x?.patient || {};
              const report = x?.report || {};
              const reportId = report?._id ? String(report._id) : `${idx}`;

              return (
                <div
                  key={reportId}
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 flex-shrink-0">
                          <FileText size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">
                            {report.title || "Medical Report"}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            {patient.name || "Unknown Patient"} • {patient.email || "--"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {report.reportType && (
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                            {report.reportType}
                          </span>
                        )}
                        {report.reportDate && (
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">
                            {new Date(report.reportDate).toLocaleDateString()}
                          </span>
                        )}
                        {report.isCritical && (
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-600">
                            Critical
                          </span>
                        )}
                      </div>

                      {report.description && (
                        <p className="mt-3 text-sm text-slate-600">
                          {report.description}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => openReport(report._id)}
                        className="text-xs font-semibold px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition"
                      >
                        View
                      </button>
                      <button
                        onClick={() => downloadReport(report._id)}
                        className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition inline-flex items-center gap-1.5"
                      >
                        <Download size={14} />
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}