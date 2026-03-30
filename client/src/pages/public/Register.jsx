import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const RegistrationPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient',
    acceptTerms: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const getRedirectPathByRole = (role) => {
    if (role === 'patient') return '/patient/setup';
    // Send doctors straight to the professional details form
    if (role === 'doctor') return '/doctor/profile';
    if (role === 'admin') return '/admin/dashboard';
    return '/';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.acceptTerms) {
      setError('Please accept Terms of Service and Privacy Policy.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    setLoading(true);
    try {
      const user = await register(form.name, form.email, form.password, form.role);
      navigate(getRedirectPathByRole(user?.role));
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-surface font-body min-h-screen flex flex-col selection:bg-primary-fixed selection:text-on-primary-fixed">
      <main className="flex-grow flex items-center justify-center p-6 relative overflow-hidden">
        {/* Subtle Background Texture */}
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none">
          <svg height="100%" width="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern height="40" id="grid" patternUnits="userSpaceOnUse" width="40">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect fill="url(#grid)" height="100%" width="100%" />
          </svg>
        </div>

        {/* Decorative Aura Elements */}
        <div className="absolute top-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-primary-fixed/20 rounded-full blur-[120px] z-0"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[30rem] h-[30rem] bg-secondary-fixed/20 rounded-full blur-[100px] z-0"></div>
        <div className="absolute top-[25%] left-[30%] w-[18rem] h-[18rem] bg-cyan-300/20 rounded-full blur-[90px] z-0"></div>

        {/* Register Container */}
        <div className="w-full max-w-[1120px] grid md:grid-cols-2 bg-surface-container-lowest rounded-2xl overflow-hidden shadow-[0_20px_70px_-28px_rgba(0,24,54,0.3)] z-10 border border-outline-variant/20 backdrop-blur-md">
          {/* Left Side: Visual/Branding (Hidden on mobile) */}
          <div className="hidden md:flex flex-col justify-between p-12 text-white relative bg-gradient-to-br from-[#001836] via-[#00244a] to-[#00356b]">
            <div className="z-10">
              <h1 className="text-3xl font-extrabold tracking-tight mb-2">Nexus Health</h1>
              <p className="text-on-primary-container text-sm font-medium tracking-wide uppercase opacity-80">The Architectural Healer</p>
            </div>

            <div className="z-10 space-y-6">
              <div className="space-y-2">
                <h2 className="text-4xl font-bold leading-tight tracking-tight">Create your care profile,<br />in under a minute.</h2>
                <p className="text-primary-fixed/70 text-lg leading-relaxed max-w-sm">Set up your secure account once and unlock appointments, reports, prescriptions, and personalized care workflows.</p>
              </div>

              <div className="flex items-center gap-4 py-6 border-t border-white/10">
                <div className="p-3 bg-white/10 rounded-lg backdrop-blur-md ring-1 ring-white/20">
                  <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                </div>
                <div>
                  <p className="font-semibold">Trusted Identity Layer</p>
                  <p className="text-xs text-primary-fixed/60">Role-aware onboarding for patients and doctors</p>
                </div>
              </div>
            </div>

            <div className="absolute inset-0 opacity-20 z-0 mix-blend-overlay">
              <img
                alt="abstract medical concept"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAo_vilBBOIIjzbz2tCf-uVdrZs4NaMhnUgYsgDfQfuJVhDuJFhPPhoTh27TwhN-VSqOGIlsEWjsYYg5vwyNWMTqF9wsJbhOJJ0eHvE66yvn37mJPOxHyQtygQ7obaPblSqe_M6-3khEo6DTNXepwoaFq5wxVpV_ylkfJuLrYgoUdFzgaBKPXY7QAJISz4r-hpPt3u4nv8pe924BsmkWCUl9f3OPPHc30neIP5U3-Wx0NA3oqxTVPjeTPC2HWlizmW8rCwoWnykWkk"
              />
            </div>
          </div>

          {/* Right Side: Register Form */}
          <div className="p-8 md:p-16 flex flex-col justify-center bg-gradient-to-b from-white to-slate-50/70">
            <div className="mb-8 md:mb-10">
              <div className="md:hidden inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold uppercase tracking-[0.14em] mb-5">
                <span className="material-symbols-outlined text-[14px]">health_and_safety</span>
                Nexus Health Secure Registration
              </div>
              <h3 className="text-3xl font-black tracking-tight text-primary mb-2">Create Account</h3>
              <p className="text-on-surface-variant">Start your secure healthcare journey in just a few steps.</p>
            </div>

            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-secondary/80">Account Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="relative flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 bg-surface-container-low cursor-pointer hover:bg-white transition-all">
                    <input className="peer absolute opacity-0" name="role" type="radio" value="patient" checked={form.role === 'patient'} onChange={handleChange} />
                    <span className="material-symbols-outlined text-base text-outline/70 peer-checked:text-primary">person</span>
                    <span className="text-sm font-semibold text-on-surface-variant peer-checked:text-primary">Patient</span>
                    <span className="absolute inset-0 rounded-xl border-2 border-transparent peer-checked:border-primary/40"></span>
                  </label>
                  <label className="relative flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 bg-surface-container-low cursor-pointer hover:bg-white transition-all">
                    <input className="peer absolute opacity-0" name="role" type="radio" value="doctor" checked={form.role === 'doctor'} onChange={handleChange} />
                    <span className="material-symbols-outlined text-base text-outline/70 peer-checked:text-primary">medical_services</span>
                    <span className="text-sm font-semibold text-on-surface-variant peer-checked:text-primary">Doctor</span>
                    <span className="absolute inset-0 rounded-xl border-2 border-transparent peer-checked:border-primary/40"></span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-secondary/80" htmlFor="full_name">Full Name</label>
                <div className="relative">
                  <input
                    className="w-full px-4 py-4 bg-surface-container-low border border-transparent rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary/20 focus:bg-white transition-all duration-200 placeholder:text-outline/50 shadow-sm"
                    id="full_name"
                    name="name"
                    placeholder="Dr. Jonathan Doe"
                    value={form.name}
                    onChange={handleChange}
                    required
                    type="text"
                  />
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline/40 text-sm">badge</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-secondary/80" htmlFor="email">Email Address</label>
                <div className="relative">
                  <input
                    className="w-full px-4 py-4 bg-surface-container-low border border-transparent rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary/20 focus:bg-white transition-all duration-200 placeholder:text-outline/50 shadow-sm"
                    id="email"
                    name="email"
                    placeholder="name@nexushealth.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                    type="email"
                  />
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline/40 text-sm">mail</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-secondary/80" htmlFor="password">Password</label>
                  <div className="relative">
                    <input
                      className="w-full px-4 py-4 bg-surface-container-low border border-transparent rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary/20 focus:bg-white transition-all duration-200 placeholder:text-outline/50 shadow-sm"
                      id="password"
                      name="password"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={handleChange}
                      required
                      type="password"
                    />
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline/40 text-sm">lock</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-secondary/80" htmlFor="confirm_password">Confirm Password</label>
                  <div className="relative">
                    <input
                      className="w-full px-4 py-4 bg-surface-container-low border border-transparent rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary/20 focus:bg-white transition-all duration-200 placeholder:text-outline/50 shadow-sm"
                      id="confirm_password"
                      name="confirmPassword"
                      placeholder="••••••••"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      required
                      type="password"
                    />
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline/40 text-sm">verified_user</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start justify-between py-1">
                <label className="flex items-start gap-2 cursor-pointer group pr-4">
                  <input
                    className="mt-0.5 w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/20 transition-all"
                    id="terms"
                    name="acceptTerms"
                    checked={form.acceptTerms}
                    onChange={handleChange}
                    type="checkbox"
                  />
                  <span className="text-sm text-on-surface-variant leading-relaxed group-hover:text-on-surface transition-colors">
                    I agree to the <a className="text-primary font-semibold hover:underline" href="/#terms-of-service">Terms</a> and <a className="text-primary font-semibold hover:underline" href="/#privacy-policy">Privacy Policy</a>
                  </span>
                </label>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full whitespace-nowrap">Encrypted</span>
              </div>

              <button
                className="w-full bg-gradient-to-br from-[#001836] via-[#00244a] to-[#00356b] text-white font-bold py-4 rounded-xl shadow-[0_14px_30px_-12px_rgba(0,24,54,0.9)] hover:shadow-[0_18px_36px_-14px_rgba(0,24,54,0.95)] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
                {!loading && <span className="material-symbols-outlined text-sm">arrow_forward</span>}
              </button>
            </form>

            <p className="mt-8 text-center text-xs text-outline leading-relaxed">
              By registering, you agree to our{' '}
              <a className="text-primary font-semibold hover:underline" href="/#terms-of-service">Terms of Service</a>{' '}
              and{' '}
              <a className="text-primary font-semibold hover:underline" href="/#privacy-policy">Privacy Policy</a>.
            </p>

            <p className="mt-6 text-center text-sm text-on-surface-variant">
              Already have an account? <Link className="text-primary font-semibold hover:underline" to="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col md:flex-row justify-between items-center px-8 max-w-screen-2xl mx-auto gap-6 font-inter text-sm tracking-wide text-blue-900 dark:text-blue-100">
          <div className="flex items-center gap-2">
            <span className="font-bold text-blue-950 dark:text-white">Nexus Health</span>
            <span className="text-slate-400">|</span>
            <p className="text-slate-500 dark:text-slate-400">© 2024 Nexus Health. The Architectural Healer.</p>
          </div>
          <nav className="flex gap-8">
            <a className="text-slate-500 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors ease-out duration-200" href="/#privacy-policy">Privacy Policy</a>
            <a className="text-slate-500 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors ease-out duration-200" href="/#terms-of-service">Terms of Service</a>
            <a className="text-slate-500 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors ease-out duration-200" href="/#hipaa-compliance">HIPAA Compliance</a>
            <a className="text-slate-500 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors ease-out duration-200" href="/#contact">Contact</a>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default RegistrationPage;