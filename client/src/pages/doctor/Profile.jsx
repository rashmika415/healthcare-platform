import { useState, useEffect } from "react";
import api from "../../services/api";
import Sidebar from "../../components/doctor/Sidebar";
import Topbar from "../../components/doctor/Topbar";
import { User, Briefcase, Building2, FileText, Mail, CheckCircle, XCircle, BadgeDollarSign } from "lucide-react";

export default function DoctorProfile() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    specialization: "",
    experience: "",
    hospital: "",
    bio: "",
    consultationFee: "",
  });
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const getStoredUser = () => {
    try {
      const persistence = localStorage.getItem("authPersistence");
      if (persistence === "local") {
        return JSON.parse(localStorage.getItem("user")) || {};
      } else {
        return (
          JSON.parse(sessionStorage.getItem("user")) ||
          JSON.parse(localStorage.getItem("user")) ||
          {}
        );
      }
    } catch {
      return {};
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const storedUser = getStoredUser();
      console.log("👤 Stored user:", storedUser);

      setForm(prev => ({
        ...prev,
        name: storedUser.name || "",
        email: storedUser.email || "",
      }));

      try {
        const res = await api.get("/doctor/profile");
        const d = res.data;
        console.log("✅ Profile from DB:", d);
        setForm({
          name: storedUser.name || d.name || "",
          email: storedUser.email || d.email || "",
          specialization: d.specialization || "",
          experience: d.experience || "",
          hospital: d.hospital || "",
          bio: d.bio || "",
          consultationFee: d.consultationFee ?? "",
        });
        setIsVerified(d.isVerified || false);
      } catch (err) {
        console.log("❌ Profile error:", err.response?.status, err.response?.data);
        if (err.response?.status === 404) {
          setForm(prev => ({
            ...prev,
            name: storedUser.name || "",
            email: storedUser.email || "",
          }));
        } else {
          setMessage({ type: "error", text: "Failed to load profile data." });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.specialization || !form.experience || !form.hospital || !form.bio || form.consultationFee === "") {
      setMessage({ type: "error", text: "Please fill all required fields." });
      return;
    }
    try {
      setSaving(true);
      // ✅ Send name & email too — backend needs them for upsert
      const res = await api.post("/doctor/profile", {
        name: form.name,
        email: form.email,
        specialization: form.specialization,
        experience: Number(form.experience),
        hospital: form.hospital,
        bio: form.bio,
        consultationFee: Number(form.consultationFee),
      });
      console.log("✅ Profile saved:", res.data);
      setMessage({ type: "success", text: "Profile saved successfully!" });
    } catch (err) {
      console.log("❌ Save error:", err.response?.status, err.response?.data);
      setMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to save profile.",
      });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-slate-100 to-slate-50">
      <Sidebar />

      <div className="flex-1 p-6">
        <Topbar />

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">Loading profile...</p>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">

            {/* Header Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold shrink-0">
                  {form.name?.charAt(0)?.toUpperCase() || "D"}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-gray-800 truncate">
                    {form.name || "Doctor"}
                  </h2>
                  <p className="text-sm text-gray-400 truncate">
                    {form.email || "—"}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {isVerified ? (
                      <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full font-medium border border-green-100">
                        <CheckCircle size={11} /> Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2.5 py-0.5 rounded-full font-medium border border-yellow-100">
                        <XCircle size={11} /> Pending Verification
                      </span>
                    )}
                    {form.specialization && (
                      <span className="text-xs text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full font-medium border border-blue-100">
                        {form.specialization}
                      </span>
                    )}
                    {form.experience && (
                      <span className="text-xs text-gray-500 bg-gray-50 px-2.5 py-0.5 rounded-full font-medium border border-gray-100">
                        {form.experience} yrs experience
                      </span>
                    )}
                    {form.consultationFee !== "" && (
                      <span className="text-xs text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full font-medium border border-emerald-100">
                        Fee: {Number(form.consultationFee).toLocaleString()} 
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Message */}
            {message && (
              <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
                message.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-600 border border-red-200"
              }`}>
                {message.type === "success"
                  ? <CheckCircle size={15} />
                  : <XCircle size={15} />
                }
                {message.text}
              </div>
            )}

            {/* Form Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-base font-bold text-gray-700 mb-5">
                Profile Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
                    <User size={11} /> Full Name
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    disabled
                    className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-400 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
                    <Mail size={11} /> Email
                  </label>
                  <input
                    name="email"
                    value={form.email}
                    disabled
                    className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-400 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
                    <Briefcase size={11} /> Specialization
                    <span className="text-red-400 ml-0.5">*</span>
                  </label>
                  <input
                    name="specialization"
                    value={form.specialization}
                    onChange={handleChange}
                    placeholder="e.g. Cardiology"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
                    <Briefcase size={11} /> Experience (years)
                    <span className="text-red-400 ml-0.5">*</span>
                  </label>
                  <input
                    name="experience"
                    type="number"
                    min="0"
                    value={form.experience}
                    onChange={handleChange}
                    placeholder="e.g. 5"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
                    <Building2 size={11} /> Hospital
                    <span className="text-red-400 ml-0.5">*</span>
                  </label>
                  <input
                    name="hospital"
                    value={form.hospital}
                    onChange={handleChange}
                    placeholder="e.g. City General Hospital"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
                    <BadgeDollarSign size={11} /> Consultation Fee
                    <span className="text-red-400 ml-0.5">*</span>
                  </label>
                  <input
                    name="consultationFee"
                    type="number"
                    min="0"
                    value={form.consultationFee}
                    onChange={handleChange}
                    placeholder="e.g. 500"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
                    <FileText size={11} /> Bio
                    <span className="text-red-400 ml-0.5">*</span>
                  </label>
                  <textarea
                    name="bio"
                    value={form.bio}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Write a short bio about yourself..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-60 flex items-center gap-2"
                >
                  {saving && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {saving ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}