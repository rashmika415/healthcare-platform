// client/src/pages/public/Login.jsx
import { Link } from 'react-router-dom';

export default function Login() {
  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col font-['Inter',sans-serif] antialiased">
      <main className="flex-grow flex items-center justify-center p-6 relative overflow-hidden">
        {/* Abstract Background Shapes for Clinical Sanctuary Aesthetic */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
          <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[60%] rounded-full bg-primary/5 blur-[120px]"></div>
          <div className="absolute bottom-[5%] -right-[10%] w-[50%] h-[70%] rounded-full bg-secondary-container/20 blur-[150px]"></div>
        </div>

        {/* Login Container */}
        <div className="w-full max-w-[480px] z-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-6 shadow-xl shadow-primary/20">
              <span
                className="material-symbols-outlined text-on-primary text-3xl align-middle"
                data-icon="medical_services"
              >
                medical_services
              </span>
            </div>
            <h1 className="text-4xl font-bold text-on-surface tracking-[-0.02em] mb-3">
              Nexus Health
            </h1>
            <p className="text-on-surface-variant font-medium">
              Welcome to your clinical sanctuary.
            </p>
          </div>

          <div className="bg-surface-container-lowest rounded-[2rem] p-10 shadow-[0px_24px_48px_rgba(44,52,55,0.06)] border border-outline-variant/10">
            <form className="space-y-8">
              {/* Email Field */}
              <div className="space-y-3">
                <label
                  className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1"
                  htmlFor="email"
                >
                  Email Address
                </label>
                <div className="relative">
                  <input
                    className="w-full h-14 px-5 bg-surface-container-low border-none rounded-xl text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                    id="email"
                    name="email"
                    placeholder="name@nexushealth.com"
                    type="email"
                  />
                  <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none">
                    <span
                      className="material-symbols-outlined text-outline/50 align-middle"
                      data-icon="mail"
                    >
                      mail
                    </span>
                  </div>
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label
                    className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <a
                    className="text-xs font-semibold text-primary hover:text-primary-dim transition-colors"
                    href="/forgot-password"
                  >
                    Forgot Password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    className="w-full h-14 px-5 bg-surface-container-low border-none rounded-xl text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    type="password"
                  />
                  <div className="absolute inset-y-0 right-5 flex items-center cursor-pointer">
                    <span
                      className="material-symbols-outlined text-outline/50 hover:text-primary transition-colors align-middle"
                      data-icon="visibility"
                    >
                      visibility
                    </span>
                  </div>
                </div>
              </div>

              {/* Login Button */}
              <button
                className="w-full h-14 bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold rounded-xl shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center space-x-2"
                type="submit"
              >
                <span>Login to Dashboard</span>
                <span
                  className="material-symbols-outlined text-lg align-middle"
                  data-icon="arrow_forward"
                >
                  arrow_forward
                </span>
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-surface-container-high text-center">
              <p className="text-sm text-on-surface-variant">
                Don't have an account?
                <Link
                  className="text-primary font-bold ml-1 hover:underline"
                  to="/register"
                >
                  Register with your clinic
                </Link>
              </p>
            </div>
          </div>

          {/* Footer-like Links */}
          <div className="mt-12 flex justify-center space-x-8 text-xs font-medium text-outline">
            <a className="hover:text-on-surface transition-colors" href="/privacy">
              Privacy Policy
            </a>
            <a className="hover:text-on-surface transition-colors" href="/terms">
              Terms of Service
            </a>
            <a className="hover:text-on-surface transition-colors" href="/support">
              Support
            </a>
          </div>
        </div>

        {/* Decorative Patient Care Image (Asymmetric Placement) */}
        <div className="hidden xl:block absolute top-[15%] right-[5%] w-[320px] h-[400px] rounded-[2.5rem] overflow-hidden shadow-[0px_24px_48px_rgba(44,52,55,0.06)] rotate-3 border-8 border-white">
          <img
            alt="Professional healthcare professional smiling softly in a clean modern clinic"
            className="w-full h-full object-cover"
            data-alt="Close-up of a healthcare professional in a white coat smiling warmly in a bright modern clinical setting with soft depth of field"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAYDnM1sS4xLO62AIGdEbqRImzT-vQM7Lz5HeANd2ysMK07ZRrmdAw8dq9HujvlwjXH-wYsuYiRDwc-oF8_-nGu5C-SSxLmazENuWjXtg4peN3Hm-ggj9a9NISr1TJ04zeHn1IGm6LI7-5cAXsli9esJn__XPesXTDgOxbkT39zRhdA9Ge-lcq0tQf2BS5gW8__z7kN-jmTH4rcJteQVONf5mkOtJqgwEaUIfwxljbyYcafCNG66ppirofzE5qdufgFw_m4QCLh1EQ"
          />
        </div>

        {/* Trust Badge */}
        <div className="absolute bottom-8 left-8 flex items-center space-x-3 text-on-surface-variant/60">
          <span
            className="material-symbols-outlined text-xl align-middle"
            data-icon="verified_user"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            verified_user
          </span>
          <span className="text-xs font-semibold tracking-widest uppercase">
            HIPAA Compliant Sanctuary
          </span>
        </div>
      </main>

      {/* Footer from Shared Components */}
      <footer className="w-full py-8 px-8 bg-surface-container-low border-t border-outline-variant/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
            <span
              className="material-symbols-outlined text-primary align-middle"
              data-icon="health_and_safety"
            >
              health_and_safety
            </span>
            <span>Nexus Health</span>
          </div>
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
            © 2024 Clinical Sanctuary. All rights reserved.
          </div>
          <div className="flex gap-6">
            <a
              className="text-sm font-medium text-slate-500 hover:text-blue-700 transition-all"
              href="/help"
            >
              Help Center
            </a>
            <a
              className="text-sm font-medium text-slate-500 hover:text-blue-700 transition-all"
              href="/contact"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}