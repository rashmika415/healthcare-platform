import React from "react";
import { Link } from "react-router-dom";

export default function ClinicalSanctuary() {
  const handleImageError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src =
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23475569' font-family='Arial, sans-serif' font-size='26'%3EImage unavailable%3C/text%3E%3C/svg%3E";
  };

  return (
    <div className="text-on-surface antialiased overflow-x-hidden bg-background min-h-screen font-body flex flex-col">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-none shadow-sm shadow-slate-200/50">
        <div className="flex justify-between items-center h-20 px-8 max-w-7xl mx-auto">
          <div className="flex items-center gap-8">
            <span className="text-2xl font-bold tracking-tight text-blue-700 dark:text-blue-400">
              Clinical Sanctuary
            </span>
            <div className="hidden md:flex gap-6 items-center">
              <a
                className="text-blue-700 dark:text-blue-400 font-semibold border-b-2 border-blue-600 px-1 py-1"
                href="/#appointments"
              >
                Appointments
              </a>
              <a
                className="text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors px-1 py-1"
                href="/#telemedicine"
              >
                Telemedicine
              </a>
              <a
                className="text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors px-1 py-1"
                href="/#messages"
              >
                Messages
              </a>
              <a
                className="text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors px-1 py-1"
                href="/#records"
              >
                Health Records
              </a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="px-5 py-2.5 text-sm font-semibold text-blue-700 hover:bg-slate-50 rounded-lg transition-all active:scale-95"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 text-sm font-semibold bg-primary text-on-primary rounded-lg shadow-lg shadow-primary/20 hover:bg-primary-dim transition-all active:scale-95"
            >
              Register
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative min-h-[921px] flex items-center px-8 max-w-7xl mx-auto overflow-hidden" id="appointments">
          <div className="grid md:grid-cols-2 gap-12 items-center w-full">
            <div className="z-10">
              <span className="inline-block px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold tracking-widest uppercase mb-6">
                The Future of Care
              </span>
              <h1 className="text-6xl md:text-7xl font-extrabold text-on-surface tracking-tight leading-[1.1] mb-8">
                Your Health, <span className="text-primary italic">Simplified.</span>
              </h1>
              <p className="text-lg text-on-surface-variant leading-relaxed max-w-lg mb-10">
                Experience a new standard of healthcare. Nexus Health combines
                world-class clinical expertise with seamless digital tools to
                keep you thriving.
              </p>
              <div className="flex flex-wrap gap-4">
                <button className="px-8 py-4 bg-primary text-on-primary rounded-xl font-bold text-lg hyper-shadow hover:bg-primary-dim transition-all flex items-center gap-2">
                  Book Appointment
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
                <button className="px-8 py-4 bg-surface-container-high text-primary rounded-xl font-bold text-lg hover:bg-surface-container-highest transition-all">
                  View Services
                </button>
              </div>
              <div className="mt-12 flex items-center gap-6">
                <div className="flex -space-x-3">
                  <img
                    className="w-12 h-12 rounded-full border-4 border-white object-cover"
                    data-alt="close-up portrait of a professional female doctor in white coat smiling confidently"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZh2pYYxubI_D6Sy1RgUpQ3JqQA_zjezCAygMAwDWLjx7IM9u2eNsdeE-2C4MLYU7IlH1dfkksn8esMTTN6BblmxNtm-L4G11GCldoXwINdTvADgSn6sln_yzFfYJHwveSsn3UcODE5zZnZv_opGsKA2TgJWvNKbgNIsjQsCFaDAwjD-hFYLK6Xf5tCxk4zEC_yGTmgTSkdYkLEDjPFT4TmFiLZE4HRZ1N0rLXZq_4x8y_5TmRe5RbkzqnWEbJbHYVtVvZGK_8I5Y"
                    onError={handleImageError}
                    alt="Doctor 1"
                  />
                  <img
                    className="w-12 h-12 rounded-full border-4 border-white object-cover"
                    data-alt="portrait of a friendly male physician with stethoscope around his neck in a clinical setting"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBfGP--Z7rm9yUC6XJnwuYguG1x7T2btWjg-wJrPwVyV7nNV5gsZFkO-8-KhrbYuDwWBqfmgY0hSPEvDbyezdCKG4RGXPZy7E4xgHzfHw1rGWRInKgOpES53zZktza7r3Q0Kv19jmZzqcDxPmmG5qZhWDRC4V6lXJQetzooGIDCUVNuUf_wHzFD_VETQOq-G2LhYRvvJiS3J5AY2iaCQLQhQ6YtYkbiw-9sawh74ZMHkU6b1jFHTz43XiPrx29zgfo2oYYfg2j9SzM"
                    onError={handleImageError}
                    alt="Doctor 2"
                  />
                  <img
                    className="w-12 h-12 rounded-full border-4 border-white object-cover"
                    data-alt="professional medical staff member with glasses looking directly at the camera with a calm expression"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBfNUDqRt-uB0uBcHGN2B_5J2RBobbloOPkgcXmyNZQ30TV0vXJKewfFeGWAgTSI3zKuFX5qb_AzlD1l0dcpUdrmkNpJlLbVw-bVn-yoSFn_L__kYOjpnac2qPnh1F5XTHwys4fs-DIoFognrPJY5jzhpV_XhzRPLV59tuJqB7vmzy4O6HUm8dHDuAuFeAb6xJYytg2bsyrFSgEfQHZ1VI2KxBbth9S8QhDwsA8c-WAn1yUG8WhmLxHRRliDePEpTJZ4UEVaqaNpgY"
                    onError={handleImageError}
                    alt="Doctor 3"
                  />
                </div>
                <p className="text-sm font-medium text-on-surface-variant">
                  <span className="text-on-surface font-bold">500+</span> Specialized
                  doctors ready to help
                </p>
              </div>
            </div>
            <div className="relative hidden md:block">
              {/* Modern Asymmetric Layout */}
              <div className="relative z-10 w-full h-[600px] rounded-[3rem] overflow-hidden hyper-shadow">
                <img
                  className="w-full h-full object-cover"
                  data-alt="high-end modern clinic interior with soft blue lighting, minimalist furniture, and a sense of calm sanctuary"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZq2LaKpNMPCmihdSPSpDABq7WbegXUDJS17-BZkb6KS3CbIpjxzg88jbHab-P7PzUdQmTziQw37XTlQ-uw_YCF3rbFSRO2Q3-kQNT7lO0PEsRBFWMitUqnNj-rozb85k6Y8TY2Au5idapr74ZRFWoueVEe5O55GsOv9DyumALgsW0K8Yu0LQfxr9lNoOEOJsb-h7hp8a90dWzTHhDAQQoD9xk4248sRwuekmO4oy-eLDtUcIanz7wzfZnHJ8uwcpVZquq-sGzqfs"
                  onError={handleImageError}
                  alt="Clinic Interior"
                />
                <div className="absolute bottom-8 left-8 right-8 p-6 glass-nav rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-primary mb-1 uppercase tracking-wider">
                      Now Live
                    </p>
                    <p className="text-sm font-bold text-on-surface">
                      Digital Vitals Monitoring
                    </p>
                  </div>
                  <span
                    className="material-symbols-outlined text-primary"
                    data-weight="fill"
                  >
                    vital_signs
                  </span>
                </div>
              </div>
              {/* Decorative Floating Elements */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-tertiary-container/30 blur-[60px] rounded-full"></div>
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-primary-container/20 blur-[100px] rounded-full"></div>
            </div>
          </div>
        </section>

        {/* Search & Quick Actions */}
        <section className="px-8 -mt-20 relative z-20" id="messages">
          <div className="max-w-6xl mx-auto bg-surface-container-lowest rounded-[2rem] p-8 md:p-12 hyper-shadow border border-outline-variant/10">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="md:col-span-3">
                <label className="block text-sm font-bold text-on-surface-variant mb-4 tracking-widest uppercase">
                  Find your specialist
                </label>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                      search
                    </span>
                    <input
                      className="w-full pl-12 pr-4 py-4 rounded-xl bg-surface-container border-none focus:ring-2 focus:ring-primary/20 text-on-surface placeholder-outline-variant"
                      placeholder="Specialty or Doctor name"
                      type="text"
                    />
                  </div>
                  <div className="flex-1 relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                      location_on
                    </span>
                    <input
                      className="w-full pl-12 pr-4 py-4 rounded-xl bg-surface-container border-none focus:ring-2 focus:ring-primary/20 text-on-surface placeholder-outline-variant"
                      placeholder="Location"
                      type="text"
                    />
                  </div>
                  <button className="px-10 py-4 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary-dim transition-all">
                    Search
                  </button>
                </div>
              </div>
              <div className="flex flex-col justify-end">
                <div className="p-4 bg-surface-container-low rounded-xl flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-lg">
                      videocam
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">
                      Telemedicine
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      Available 24/7
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Telemedicine & Services Bento Grid */}
        <section className="py-24 px-8 max-w-7xl mx-auto" id="telemedicine">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-bold tracking-tight text-on-surface mb-4">
              Complete Care, Anywhere
            </h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto">
              Access our full range of medical services from the comfort of your
              home or in person at our state-of-the-art facilities.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Main Feature */}
            <div className="md:col-span-8 bg-surface-container-low rounded-[2.5rem] p-10 flex flex-col justify-between overflow-hidden relative group">
              <div className="relative z-10">
                <span className="px-4 py-1.5 rounded-full bg-white text-primary text-xs font-bold mb-6 inline-block">
                  MOST POPULAR
                </span>
                <h3 className="text-3xl font-bold mb-4 max-w-md">
                   Video Consultations with Top Specialists
                </h3>
                <p className="text-on-surface-variant max-w-sm mb-8">
                  Skip the waiting room. Connect with board-certified doctors in
                  minutes via secure video link.
                </p>
                <ul className="space-y-3 mb-10">
                  <li className="flex items-center gap-3 text-sm font-medium">
                    <span
                      className="material-symbols-outlined text-primary text-lg"
                      data-weight="fill"
                    >
                      check_circle
                    </span>
                    Prescription renewals in-app
                  </li>
                  <li className="flex items-center gap-3 text-sm font-medium">
                    <span
                      className="material-symbols-outlined text-primary text-lg"
                      data-weight="fill"
                    >
                      check_circle
                    </span>
                    Secure medical file sharing
                  </li>
                </ul>
                <button className="px-6 py-3 bg-white text-primary rounded-lg font-bold hover:shadow-lg transition-all">
                  Launch Telemedicine
                </button>
              </div>
              <img
                className="absolute right-0 bottom-0 w-1/2 h-full object-cover rounded-l-[3rem] hidden lg:block grayscale group-hover:grayscale-0 transition-all duration-700"
                data-alt="a professional doctor speaking during a video call on a tablet, clear high-definition screen showing a patient-centric medical interface"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdB_odsh--7_zjr-B7rRYJaKK9yUxXhbNGP7cDkGAS4XqNVyBe8oNWWaDi1IJochxvGxhRiAgdrRuZpi-VUOmoCXD8WlHFzENEhxDbQQ4pzlSz7Dzqq-Mz0Kv01b5nKgSv7msyrVBwh5zfYV427pAuGnTGg1f4EPqnAgZF8g5LFBXeuNH4rCQY8GPVXUbtFiFL_P_z95K7F95g3LnG9tjrShykRnuxWL3BVZEroiCz3Sbgqswt_WDzcUiy58WNFWQYcSiL4pUsm3U"
                onError={handleImageError}
                alt="Doctor Video Call"
              />
            </div>
            {/* Secondary Features */}
            <div className="md:col-span-4 space-y-6">
              <div className="bg-primary text-on-primary rounded-[2.5rem] p-8 h-full flex flex-col justify-between group">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-3xl">
                    calendar_month
                  </span>
                </div>
                <div>
                  <h4 className="text-xl font-bold mb-2">Instant Booking</h4>
                  <p className="text-on-primary/80 text-sm mb-6">
                    Find and book appointments with real-time availability in under
                    60 seconds.
                  </p>
                  <a
                    className="text-sm font-bold flex items-center gap-2 group-hover:translate-x-2 transition-transform"
                    href="/register"
                  >
                    Get started{" "}
                    <span className="material-symbols-outlined text-xs">
                      arrow_forward
                    </span>
                  </a>
                </div>
              </div>
            </div>
            {/* Bottom Row Features */}
            <div className="md:col-span-4 bg-tertiary-container/30 rounded-[2.5rem] p-8 group">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 hyper-shadow">
                <span className="material-symbols-outlined text-tertiary text-3xl">
                  pill
                </span>
              </div>
              <h4 className="text-xl font-bold mb-2">Smart Pharmacy</h4>
              <p className="text-on-surface-variant text-sm">
                Automated refills and doorstep delivery for all your prescribed
                medications.
              </p>
            </div>
            <div className="md:col-span-4 bg-surface-container-high rounded-[2.5rem] p-8 border border-white" id="records">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <span className="material-symbols-outlined text-primary text-3xl">
                  analytics
                </span>
              </div>
              <h4 className="text-xl font-bold mb-2">Health Analytics</h4>
              <p className="text-on-surface-variant text-sm">
                Monitor your vitals and long-term trends with integrated smart
                device sync.
              </p>
            </div>
            <div className="md:col-span-4 bg-secondary-container rounded-[2.5rem] p-8 relative overflow-hidden">
              <div className="relative z-10">
                <h4 className="text-xl font-bold mb-2">24/7 Support</h4>
                <p className="text-on-surface-variant text-sm">
                  Our medical concierges are always here to help with your inquiries.
                </p>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <span className="material-symbols-outlined text-[120px]">
                  support_agent
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24 bg-surface-container-low overflow-hidden">
          <div className="max-w-7xl mx-auto px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
              <div>
                <span className="text-primary font-bold tracking-widest uppercase text-xs mb-4 block">
                  Patient Stories
                </span>
                <h2 className="text-4xl md:text-5xl font-bold text-on-surface tracking-tight">
                  Trusted by Thousands
                </h2>
              </div>
              <div className="flex gap-4">
                <button className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center hover:bg-white transition-all">
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center hover:bg-primary-dim transition-all shadow-lg shadow-primary/20">
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
            <div className="flex gap-8 overflow-x-auto no-scrollbar pb-12">
              {/* Testimonial 1 */}
              <div className="min-w-[350px] md:min-w-[450px] bg-white rounded-[2rem] p-10 hyper-shadow flex flex-col justify-between">
                <div>
                  <div className="flex gap-1 text-primary mb-6">
                    <span className="material-symbols-outlined" data-weight="fill">star</span>
                    <span className="material-symbols-outlined" data-weight="fill">star</span>
                    <span className="material-symbols-outlined" data-weight="fill">star</span>
                    <span className="material-symbols-outlined" data-weight="fill">star</span>
                    <span className="material-symbols-outlined" data-weight="fill">star</span>
                  </div>
                  <p className="text-lg italic text-on-surface mb-10 leading-relaxed">
                    "The seamless integration of telemedicine and in-person care
                    at Nexus Health has changed how I view healthcare. It's
                    actually convenient now."
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <img
                    className="w-12 h-12 rounded-full object-cover"
                    data-alt="portrait of a middle-aged man with a neat beard and smiling eyes, outdoor urban lighting"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0jDE-9lIJkXgh7xzUWakLUsL2vI66k3GdZJhgWu8-_DXaVwhu97XSmgzQfg3FHZhZGp20s9pI0yI2h5JH2IWAXvgnogVJ_UtqJPTfvx8rHxnQUUsdk-kjdN_2eqoiCcwmvULp31zgZgvI8dHRvnW2Elwx_p0AiHx7gbM0j5rpeuVgA-aeNfWMiz2JJX721wHBrJ6SxKCKaC5i1uVIspIGrF-yxQGXaGNxy4ARapmuSLJCfqbZ0egRawk8qaUPOfnWFKx5aHh0ksk"
                    onError={handleImageError}
                    alt="David Chen"
                  />
                  <div>
                    <p className="font-bold text-on-surface">David Chen</p>
                    <p className="text-sm text-on-surface-variant">
                      Patient since 2022
                    </p>
                  </div>
                </div>
              </div>
              {/* Testimonial 2 */}
              <div className="min-w-[350px] md:min-w-[450px] bg-white rounded-[2rem] p-10 hyper-shadow flex flex-col justify-between">
                <div>
                  <div className="flex gap-1 text-primary mb-6">
                    <span className="material-symbols-outlined" data-weight="fill">star</span>
                    <span className="material-symbols-outlined" data-weight="fill">star</span>
                    <span className="material-symbols-outlined" data-weight="fill">star</span>
                    <span className="material-symbols-outlined" data-weight="fill">star</span>
                    <span className="material-symbols-outlined" data-weight="fill">star</span>
                  </div>
                  <p className="text-lg italic text-on-surface mb-10 leading-relaxed">
                    "I was able to get a specialist consultation within 4 hours.
                    The medical sanctuary experience is real—it feels calm and
                    professional."
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <img
                    className="w-12 h-12 rounded-full object-cover"
                    data-alt="portrait of a young woman with curly hair looking thoughtful and happy, soft natural window lighting"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuArylbmY30VSBBMGPJu1UwPDZutflhC5v9m-GsQBmZKv-MYYPhkiQgeLANf3B_lnJuQ8rqUgIt4u9rL0Yy27Tm5xUpQPFuHCwk8y8BUK0m9EyC_CynYz5aUN-teR3TqCZW8aSGcVbEHxiI6Oxt1evF5-g3bH7o5MUOpsyj1gsWsTm-BCYw_x-BjUfQMsJD6ESEbO0fdyVvj3-heJ1VHR5mKCpOyfdH_R2GQUFgSdFBvM6iQhMomBC8Z_alu8Rkf7w1KdMFkShdLs94"
                    onError={handleImageError}
                    alt="Sarah Jenkins"
                  />
                  <div>
                    <p className="font-bold text-on-surface">Sarah Jenkins</p>
                    <p className="text-sm text-on-surface-variant">
                      Patient since 2023
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 px-8 max-w-7xl mx-auto">
          <div className="bg-primary rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-on-primary mb-8 tracking-tight">
                Ready to prioritize your health?
              </h2>
              <p className="text-on-primary/80 text-lg mb-12">
                Join over 50,000 patients who have simplified their medical
                journey with Clinical Sanctuary.
              </p>
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <button className="px-10 py-5 bg-white text-primary rounded-xl font-bold text-lg hover:shadow-2xl transition-all active:scale-95">
                  Get Started Now
                </button>
                <button className="px-10 py-5 bg-primary-dim text-on-primary rounded-xl font-bold text-lg border border-white/20 hover:bg-primary transition-all active:scale-95">
                  Talk to Sales
                </button>
              </div>
            </div>
            {/* Background decorative elements */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/4 translate-y-1/4"></div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 px-8 mt-auto bg-slate-50 dark:bg-slate-950">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-7xl mx-auto">
          <div className="col-span-1 md:col-span-1">
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100 block mb-6">
              Clinical Sanctuary
            </span>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Pioneering a new era of healthcare where technology meets empathy.
            </p>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 hover:bg-primary hover:text-white transition-all cursor-pointer">
                <span className="material-symbols-outlined text-sm">public</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 hover:bg-primary hover:text-white transition-all cursor-pointer">
                <span className="material-symbols-outlined text-sm">share</span>
              </div>
            </div>
          </div>
          <div>
            <h5 className="font-bold text-slate-800 dark:text-slate-100 mb-6">
              Platform
            </h5>
            <ul className="space-y-4">
              <li>
                <a className="text-sm font-medium text-slate-500 hover:text-blue-700 transition-all" href="/#appointments">Appointments</a>
              </li>
              <li>
                <a className="text-sm font-medium text-slate-500 hover:text-blue-700 transition-all" href="/#telemedicine">Telemedicine</a>
              </li>
              <li>
                <a className="text-sm font-medium text-slate-500 hover:text-blue-700 transition-all" href="/#records">Health Records</a>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-slate-800 dark:text-slate-100 mb-6">
              Company
            </h5>
            <ul className="space-y-4">
              <li>
                <a className="text-sm font-medium text-slate-500 hover:text-blue-700 transition-all" href="/about">About Us</a>
              </li>
              <li>
                <a className="text-sm font-medium text-slate-500 hover:text-blue-700 transition-all" href="/privacy">Privacy Policy</a>
              </li>
              <li>
                <a className="text-sm font-medium text-slate-500 hover:text-blue-700 transition-all" href="/terms">Terms of Service</a>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-slate-800 dark:text-slate-100 mb-6">
              Contact
            </h5>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-sm text-slate-500">
                <span className="material-symbols-outlined text-xs">mail</span>{" "}
                support@clinicalsanctuary.com
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-500">
                <span className="material-symbols-outlined text-xs">call</span>{" "}
                +1 (800) NEXUS-CARE
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-slate-200 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            © 2024 Clinical Sanctuary. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a className="text-xs text-slate-400 hover:text-primary" href="/cookies">Cookie Settings</a>
            <a className="text-xs text-slate-400 hover:text-primary" href="/sitemap">Sitemap</a>
          </div>
        </div>
      </footer>
    </div>
  );
}