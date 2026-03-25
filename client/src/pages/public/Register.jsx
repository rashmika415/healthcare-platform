import { Link } from "react-router-dom";

export default function Register() {
  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col font-['Inter',sans-serif]">
      {/* Navigation suppressed for transactional focus per "The Destination Rule" */}
      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        
        {/* Background Accents */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-tertiary/5 rounded-full blur-3xl"></div>
        </div>

        <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-0 rounded-xl overflow-hidden shadow-xl shadow-on-surface/5 relative z-10">
          
          {/* Brand Column */}
          <div className="lg:w-5/12 bg-primary p-12 text-on-primary flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-12">
                <div className="w-10 h-10 bg-on-primary rounded-lg flex items-center justify-center">
                  <span
                    className="material-symbols-outlined text-primary"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    health_and_safety
                  </span>
                </div>
                <span className="text-2xl font-extrabold tracking-tight">
                  Clinical Sanctuary
                </span>
              </div>
              <h1 className="text-4xl font-bold leading-tight mb-6">
                Begin Your Health Journey With Confidence.
              </h1>
              <p className="text-on-primary/80 text-lg leading-relaxed mb-8">
                Experience a premium digital health ecosystem designed for calm authority and exceptional care.
              </p>
            </div>
            
            <div className="relative z-10">
              <div className="flex -space-x-3 mb-4">
                <img
                  className="w-10 h-10 rounded-full border-2 border-primary object-cover"
                  data-alt="portrait of a professional female doctor in white coat smiling confidently"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBCmh4rRv064ZZmMNuAL_Wur6aKiw9yo06IuucbZx5hf1H2xYL2KLifJC1vyjY9H-c8RgDh2S7Ll78O_HzcYTHSm9EdhMX8aoN7i5eUoTSQXcd8LQdVKvKN57WzjaOXqPHpfgcfKdtUx4xcJBgQWbi2NNZd0GjMHsRSIfvQ5-nuOXnsyapmgPi3efHkRi5UFyiSDaVCG_aoFuOBL37-KrXUl9jZzrc8mAkhFoTBFBZNfDUAX17CrtSKo67IkDhz0gTsszCHkovZaoo"
                  alt="Professional Doctor"
                />
                <img
                  className="w-10 h-10 rounded-full border-2 border-primary object-cover"
                  data-alt="portrait of a male physician with stethoscope in a clean clinical environment"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD8YErM9160lZGR3jVprNZ_KSqVQsiywcciLtWxPADLRI1xxJROYMzesOGoHC5_-Reaue20xNbqG0qw0_kuqHbZR2pfxv3qoPK-Pp0NFmnHkauyGRtafHYhwYc1V-gliXtgUD8yIVC4Z5tEKp4N6rwRR4ejEP7-BRTnoFyq7e0vWZ-oKkcCI2PRzD5FjsZp6Imhc3mrsl_aKbwgqdiW-uPROwThlQ2t7OMcYSgj99n20-k96vI7nUqFdbrluNvlsfMBekfrER5KzTo"
                  alt="Male Physician"
                />
                <img
                  className="w-10 h-10 rounded-full border-2 border-primary object-cover"
                  data-alt="close-up of a healthcare provider in medical scrubs with soft lighting"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuApH_-yArthH_ptN5TGCww3iF2k4sTOe1zxrfuxgJhqjCeah3ZUF9Wao2HQhP7e81K0fuO92CW-BCYr_fEQXkCG0Ga-5PgWpsulpGI2WKnX0LXHx8WMRRBN66HjuSgyVYcrF6BCPWNOwrhn0EVV5Pa4obI61Q0a0PunSHLfrcmwfFqXRJ7z55EGR23XN4l4cdfr6fnPwjEF1YTi-5NT47EwgUCO5VOmPBg9Vytm9smRNynh0Y1CSphVNJ6K2u-SAKDiWOFbM1X7Fx4"
                  alt="Healthcare Provider"
                />
              </div>
              <p className="text-sm font-medium text-on-primary/90">
                Joined by 10,000+ patients and specialists this month.
              </p>
            </div>
            {/* Abstract shape in background of left column */}
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary-container/20 rounded-full"></div>
          </div>

          {/* Form Column */}
          <div className="lg:w-7/12 bg-surface-container-lowest p-8 lg:p-16">
            <div className="max-w-md mx-auto">
              <header className="mb-10">
                <h2 className="text-2xl font-bold text-on-surface mb-2">
                  Create Account
                </h2>
                <p className="text-on-surface-variant">
                  Join Nexus Health to access clinical services.
                </p>
              </header>

              <form action="#" className="space-y-6">
                {/* Role Selector */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    Account Type
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="relative flex flex-col items-center justify-center p-4 rounded-xl border-2 border-surface-container-high bg-surface cursor-pointer hover:bg-surface-container-low transition-all group">
                      <input
                        defaultChecked
                        className="peer absolute opacity-0"
                        name="role"
                        type="radio"
                        value="patient"
                      />
                      <div className="peer-checked:text-primary transition-colors flex flex-col items-center gap-2">
                        <span className="material-symbols-outlined text-3xl">
                          person
                        </span>
                        <span className="text-sm font-semibold">Patient</span>
                      </div>
                      <div className="absolute inset-0 border-2 border-transparent peer-checked:border-primary rounded-xl transition-all"></div>
                    </label>
                    <label className="relative flex flex-col items-center justify-center p-4 rounded-xl border-2 border-surface-container-high bg-surface cursor-pointer hover:bg-surface-container-low transition-all group">
                      <input
                        className="peer absolute opacity-0"
                        name="role"
                        type="radio"
                        value="doctor"
                      />
                      <div className="peer-checked:text-primary transition-colors flex flex-col items-center gap-2">
                        <span className="material-symbols-outlined text-3xl">
                          medical_services
                        </span>
                        <span className="text-sm font-semibold">Doctor</span>
                      </div>
                      <div className="absolute inset-0 border-2 border-transparent peer-checked:border-primary rounded-xl transition-all"></div>
                    </label>
                  </div>
                </div>

                {/* Full Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-on-surface" htmlFor="full_name">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-outline-variant text-sm">
                        badge
                      </span>
                    </div>
                    <input
                      className="block w-full pl-11 pr-4 py-3 bg-surface border-none ring-1 ring-outline-variant/20 rounded-xl focus:ring-2 focus:ring-primary/40 focus:bg-surface-container-lowest transition-all placeholder:text-outline-variant/60 text-on-surface"
                      id="full_name"
                      name="full_name"
                      placeholder="Dr. Jonathan Doe"
                      type="text"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-on-surface" htmlFor="email">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-outline-variant text-sm">
                        mail
                      </span>
                    </div>
                    <input
                      className="block w-full pl-11 pr-4 py-3 bg-surface border-none ring-1 ring-outline-variant/20 rounded-xl focus:ring-2 focus:ring-primary/40 focus:bg-surface-container-lowest transition-all placeholder:text-outline-variant/60 text-on-surface"
                      id="email"
                      name="email"
                      placeholder="name@example.com"
                      type="email"
                    />
                  </div>
                </div>

                {/* Password Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-on-surface" htmlFor="password">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-outline-variant text-sm">
                          lock
                        </span>
                      </div>
                      <input
                        className="block w-full pl-11 pr-4 py-3 bg-surface border-none ring-1 ring-outline-variant/20 rounded-xl focus:ring-2 focus:ring-primary/40 focus:bg-surface-container-lowest transition-all placeholder:text-outline-variant/60 text-on-surface"
                        id="password"
                        name="password"
                        placeholder="••••••••"
                        type="password"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-on-surface" htmlFor="confirm_password">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-outline-variant text-sm">
                          verified_user
                        </span>
                      </div>
                      <input
                        className="block w-full pl-11 pr-4 py-3 bg-surface border-none ring-1 ring-outline-variant/20 rounded-xl focus:ring-2 focus:ring-primary/40 focus:bg-surface-container-lowest transition-all placeholder:text-outline-variant/60 text-on-surface"
                        id="confirm_password"
                        name="confirm_password"
                        placeholder="••••••••"
                        type="password"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 py-2">
                  <input
                    className="mt-1 w-4 h-4 text-primary bg-surface border-outline-variant/40 rounded focus:ring-primary/40"
                    id="terms"
                    type="checkbox"
                  />
                  <label className="text-sm text-on-surface-variant leading-tight" htmlFor="terms">
                    I agree to the{" "}
                    <a className="text-primary font-semibold hover:underline" href="/terms">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a className="text-primary font-semibold hover:underline" href="/privacy">
                      Privacy Policy
                    </a>.
                  </label>
                </div>

                <button
                  className="w-full py-4 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dim active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  type="submit"
                >
                  <span>Register Account</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </form>

              <footer className="mt-10 pt-8 border-t border-surface-container-high text-center">
                <p className="text-on-surface-variant text-sm">
                  Already have an account?{" "}
                  <Link className="text-primary font-bold ml-1 hover:underline" to="/login">
                    Sign In
                  </Link>
                </p>
              </footer>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Component */}
      <footer className="w-full py-12 px-8 mt-auto bg-slate-50 dark:bg-slate-950">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-7xl mx-auto">
          <div className="space-y-4">
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Clinical Sanctuary
            </span>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
              Bridging the gap between medical precision and human warmth through sophisticated digital care.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest">
              Platform
            </h4>
            <nav className="flex flex-col gap-2">
              <a className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-300 underline transition-all" href="/about">
                About Us
              </a>
              <a className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-300 underline transition-all" href="/help">
                Help Center
              </a>
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest">
              Legal
            </h4>
            <nav className="flex flex-col gap-2">
              <a className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-300 underline transition-all" href="/privacy">
                Privacy Policy
              </a>
              <a className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-300 underline transition-all" href="/terms">
                Terms of Service
              </a>
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest">
              Contact
            </h4>
            <nav className="flex flex-col gap-2">
              <a className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-300 underline transition-all" href="/contact">
                Contact
              </a>
              <span className="text-xs text-slate-400">
                support@clinicalsanctuary.com
              </span>
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-slate-200 dark:border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            © 2024 Clinical Sanctuary. All rights reserved.
          </span>
          <div className="flex gap-6">
            <span className="material-symbols-outlined text-slate-400 cursor-pointer hover:text-blue-700">
              language
            </span>
            <span className="material-symbols-outlined text-slate-400 cursor-pointer hover:text-blue-700">
              shield
            </span>
            <span className="material-symbols-outlined text-slate-400 cursor-pointer hover:text-blue-700">
              verified
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}