import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import PublicNavbar from "../../components/PublicNavbar";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const validation = useMemo(() => {
    const nameOk = form.name.trim().length >= 2;
    const emailOk = emailRegex.test(form.email.trim());
    const subjectOk = form.subject.trim().length >= 3;
    const messageOk = form.message.trim().length >= 10;
    return {
      nameOk,
      emailOk,
      subjectOk,
      messageOk,
      ok: nameOk && emailOk && subjectOk && messageOk,
    };
  }, [form]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    if (!validation.ok) {
      setError("Please complete all fields (with a valid email) before sending.");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/contact", {
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
      setSuccess("Thanks! Your message was sent. We’ll get back to you soon.");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PublicNavbar />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_15%_20%,rgba(147,197,253,0.35),transparent_38%),radial-gradient(circle_at_88%_14%,rgba(30,64,175,0.2),transparent_30%)]" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <div className="relative flex items-start sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Contact
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Send a message to Nexus Health
            </h1>
            <p className="text-sm text-slate-500 mt-2 max-w-2xl">
              For account help, appointments, or general questions — reach out and we’ll respond.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/"
              className="px-4 py-2 rounded-xl bg-white/80 backdrop-blur border border-blue-900/10 text-sm font-semibold text-slate-700 hover:bg-white transition"
            >
              Back to Home
            </Link>
          </div>
        </div>

        <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-2xl border border-blue-900/10 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.45)] p-6">
            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {success}
              </div>
            )}

            <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-6">
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  Name
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-transparent transition"
                  placeholder="Your name"
                />
                {!validation.nameOk && form.name.length > 0 && (
                  <p className="mt-1 text-[11px] text-slate-400">Enter at least 2 characters.</p>
                )}
              </div>
              <div className="md:col-span-6">
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  Email
                </label>
                <input
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-transparent transition"
                  placeholder="you@example.com"
                />
                {!validation.emailOk && form.email.length > 0 && (
                  <p className="mt-1 text-[11px] text-slate-400">Enter a valid email address.</p>
                )}
              </div>

              <div className="md:col-span-12">
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  Subject
                </label>
                <input
                  value={form.subject}
                  onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-transparent transition"
                  placeholder="How can we help?"
                />
              </div>

              <div className="md:col-span-12">
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  Message
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                  rows={6}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-transparent transition resize-none"
                  placeholder="Please include any relevant details."
                />
                {!validation.messageOk && form.message.length > 0 && (
                  <p className="mt-1 text-[11px] text-slate-400">Enter at least 10 characters.</p>
                )}
              </div>

              <div className="md:col-span-12 flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#001836] bg-gradient-to-br from-[#001836] to-[#002d5b] disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-transform"
                >
                  {submitting ? "Sending..." : "Send Message"}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-blue-900/10 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.45)] p-6">
            <p className="text-sm font-extrabold text-slate-800 mb-2">Quick links</p>
            <div className="flex flex-col gap-2">
              <Link
                to="/appointments"
                className="px-4 py-2 rounded-xl bg-white border border-slate-100 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Book an appointment
              </Link>
              <Link
                to="/telemedicine"
                className="px-4 py-2 rounded-xl bg-white border border-slate-100 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Telemedicine
              </Link>
              <Link
                to="/health-records"
                className="px-4 py-2 rounded-xl bg-white border border-slate-100 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Health records
              </Link>
            </div>

            <div className="mt-5 text-[11px] text-slate-400 leading-relaxed">
              This form saves your message to our system. For urgent medical issues, please seek emergency care immediately.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

