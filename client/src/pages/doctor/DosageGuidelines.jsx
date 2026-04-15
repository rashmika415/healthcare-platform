import { useMemo, useState } from "react";
import Sidebar from "../../components/doctor/Sidebar";
import Topbar from "../../components/doctor/Topbar";
import DosageGuidelineForm from "../../components/doctor/DosageGuidelineForm";
import { Edit3, Plus, Search, Trash2 } from "lucide-react";

const STORAGE_KEY = "doctor_dosage_guidelines_v2";

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
};

const save = (list) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore storage errors
  }
};

export default function DosageGuidelines() {
  const [items, setItems] = useState(load);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    const q = String(search || "").trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      String(item.patientEmail || "").toLowerCase().includes(q) ||
      String(item.patientName || "").toLowerCase().includes(q) ||
      String(item.title || "").toLowerCase().includes(q) ||
      String(item.guideline || "").toLowerCase().includes(q)
    );
  }, [items, search]);

  const upsert = async (payload) => {
    setSubmitting(true);
    try {
      const next = editing?._id
        ? items.map((item) =>
            item._id === editing._id
              ? { ...item, ...payload, updatedAt: new Date().toISOString() }
              : item
          )
        : [
            {
              _id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              ...payload,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            ...items,
          ];
      setItems(next);
      save(next);
      setEditing(null);
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const remove = (id) => {
    if (!window.confirm("Delete this dosage guideline?")) return;
    const next = items.filter((item) => item._id !== id);
    setItems(next);
    save(next);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-slate-100 to-slate-50">
      <Sidebar />
      <div className="flex-1 p-6 overflow-auto">
        <Topbar />

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dosage Guidelines</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Create and manage patient-specific dosage guidelines by email
            </p>
          </div>
          <button
            onClick={() => {
              setEditing(null);
              setShowForm((prev) => !prev);
            }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold"
          >
            <Plus size={15} />
            {showForm ? "Close Form" : "New Guideline"}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
            <DosageGuidelineForm
              initialValues={editing}
              onSubmit={upsert}
              onCancel={() => {
                setEditing(null);
                setShowForm(false);
              }}
              submitting={submitting}
            />
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-4">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <Search size={14} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by patient email, patient name, title..."
              className="text-sm outline-none bg-transparent w-full text-slate-600 placeholder-slate-400"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-400">
              No dosage guidelines found
            </div>
          ) : (
            filtered.map((item) => (
              <div key={item._id} className="bg-white rounded-2xl border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{item.title}</p>
                    <p className="text-xs text-cyan-600 mt-0.5">{item.patientEmail}</p>
                    {item.patientName && <p className="text-xs text-slate-500">{item.patientName}</p>}
                    <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{item.guideline}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditing(item);
                        setShowForm(true);
                      }}
                      className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center justify-center"
                      title="Edit"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => remove(item._id)}
                      className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 flex items-center justify-center"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
