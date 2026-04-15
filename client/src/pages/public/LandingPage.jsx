import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const doctorAvatars = [
  'https://i.pravatar.cc/80?img=12',
  'https://i.pravatar.cc/80?img=32',
  'https://i.pravatar.cc/80?img=47'
];

const trustMetrics = [
  { value: '4.9/5', label: 'Patient satisfaction' },
  { value: '12 min', label: 'Average wait time' },
  { value: '24/7', label: 'Virtual triage support' }
];

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Appointments', href: '/appointments' },
  { label: 'Telemedicine', href: '/#telemedicine' },
  { label: 'Contact', href: '/#messages' },
  { label: 'Health Records', href: '/#records' }
];

const NexusHealth = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();

  const getLink = (link) => {
    if (link.label === 'Home') return '/';
    if (link.label === 'Appointments' && user) {
      if (user.role === 'patient') return '/appointments';
      if (user.role === 'doctor') return '/doctor/appointments';
      if (user.role === 'admin') return '/admin/dashboard';
    }
    return link.href;
  };

  const getProfilePathByRole = (role) => {
    if (role === 'patient') return '/patient/profile';
    if (role === 'doctor') return '/doctor/dashboard';
    if (role === 'admin') return '/admin/dashboard';
    return '/';
  };

  const profilePath = getProfilePathByRole(user?.role);

  useEffect(() => {
    const revealItems = document.querySelectorAll('.reveal');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    revealItems.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-50 text-on-surface font-body selection:bg-primary-fixed selection:text-primary">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_15%_20%,rgba(147,197,253,0.35),transparent_38%),radial-gradient(circle_at_88%_14%,rgba(30,64,175,0.2),transparent_30%)]"></div>
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-white/75 backdrop-blur-xl border-b border-blue-900/10 shadow-[0_10px_40px_-20px_rgba(0,24,54,0.25)] font-inter tracking-tight antialiased">
        <div className="flex justify-between items-center h-20 px-4 sm:px-6 lg:px-8 max-w-screen-2xl mx-auto">
          <div className="text-2xl font-headline font-bold tracking-tighter text-blue-950">Nexus Health</div>
          <div className="hidden md:flex items-center gap-10">
            {navLinks.filter(link => !link.authRequired || user).map((link, index) => {
              const targetUrl = getLink(link);
              const isRoute = targetUrl.startsWith('/');

              return isRoute ? (
                <Link
                  key={link.label}
                  className={index === 0 ? 'text-blue-900 border-b-2 border-blue-900 pb-1' : 'text-slate-500 hover:text-blue-900 transition-colors'}
                  to={targetUrl}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  className={index === 0 ? 'text-blue-900 border-b-2 border-blue-900 pb-1' : 'text-slate-500 hover:text-blue-900 transition-colors'}
                  href={targetUrl}
                >
                  {link.label}
                </a>
              );
            })}
          </div>
          <div className="flex items-center gap-3 sm:gap-5">
            <button className="hidden sm:inline-flex text-slate-500 hover:text-blue-900 transition-all duration-200 ease-out">
              <span className="material-symbols-outlined">search</span>
            </button>
            <button
              className="inline-flex md:hidden text-slate-600 hover:text-blue-900 transition-colors"
              aria-label="Toggle navigation menu"
              onClick={() => setIsMenuOpen((prev) => !prev)}
            >
              <span className="material-symbols-outlined">{isMenuOpen ? 'close' : 'menu'}</span>
            </button>
            {!user && (
              <>
                <Link
                  to="/login"
                  className="hidden sm:inline-flex px-4 py-2.5 rounded-md text-sm font-semibold text-blue-900 hover:text-blue-700 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-[#001836] text-white px-4 sm:px-5 py-2.5 rounded-md font-semibold text-sm shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-transform bg-gradient-to-br from-[#001836] to-[#002d5b]"
                >
                  Register
                </Link>
              </>
            )}
            {user && (
              <Link
                to={profilePath}
                className="hidden sm:block w-10 h-10 rounded-full bg-surface-container overflow-hidden ring-2 ring-white/70"
                aria-label="Open profile"
                title="Profile"
              >
                <img
                  alt="User profile"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBwsl_3uu5TZFBhkTbZ3nBB39Cr406ThQ6xobI6b9Ft6dZrvizZJYsKIXgfylO8437ILfeFPabf4n_R0mmXNBEjhP-VZiJ2gCqnjhsG91UDpGJi9T5r7E9YxYEMmcOHGPvCzD2VT2QvZzO1_9Z4XNTtKovdY9WeXkJbdjlZlfegXccW2ySc_cfAZLezq-wzimMBTZ3vkxXsqgP25i_ZhhsQmoRU9agrxykFX_9ZdzoPyKAGUe_RSImrTu0xMl9VBgOFtcOdi2uAYcM"
                  className="w-full h-full object-cover"
                />
              </Link>
            )}
          </div>
        </div>
        <div className={`md:hidden px-4 sm:px-6 pb-4 transition-all duration-300 ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
          <div className="rounded-2xl border border-blue-100 bg-white/95 shadow-lg p-4 space-y-3">
            {navLinks.filter(link => !link.authRequired || user).map((link) => {
              const targetUrl = getLink(link);
              const isRoute = targetUrl.startsWith('/');

              return isRoute ? (
                <Link
                  key={link.label}
                  to={targetUrl}
                  onClick={() => setIsMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-900 transition-colors"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={targetUrl}
                  onClick={() => setIsMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-900 transition-colors"
                >
                  {link.label}
                </a>
              );
            })}
            {!user && (
              <div className="pt-2 flex gap-3">
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex-1 text-center rounded-lg px-3 py-2 border border-blue-200 text-blue-900 font-semibold hover:bg-blue-50 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex-1 text-center rounded-lg px-3 py-2 bg-[#001836] text-white font-semibold bg-gradient-to-br from-[#001836] to-[#002d5b]"
                >
                  Register
                </Link>
              </div>
            )}
            {user && (
              <Link
                to={profilePath}
                onClick={() => setIsMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-center border border-blue-200 text-blue-900 font-semibold hover:bg-blue-50 transition-colors"
              >
                Profile
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="relative pt-20">
        {/* Hero Section */}
        <section className="relative min-h-[760px] flex items-center overflow-hidden px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-screen-2xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="md:col-span-7 z-10 reveal">
              <span className="inline-flex text-xs uppercase tracking-[0.18em] text-blue-800/80 bg-white/70 border border-blue-100 px-3 py-1.5 rounded-full font-semibold mb-6">
                The Architectural Healer
              </span>
              <h1 className="font-headline text-4xl sm:text-5xl lg:text-[3.8rem] leading-[1.05] font-bold tracking-tight text-primary mb-8 max-w-2xl">
                Precision Medicine. <br />Designed for <span className="text-on-primary-container">Stillness.</span>
              </h1>
              <p className="text-base sm:text-lg text-secondary max-w-xl mb-10 leading-relaxed">
                Experience a healthcare sanctuary where clinical excellence meets intentional design. Nexus Health redefines telemedicine through the lens of calm, authoritative care.
              </p>
              
              {/* Advanced Search Bar */}
              <div className="bg-white/90 p-2 rounded-2xl shadow-[0_24px_60px_-28px_rgba(15,23,42,0.45)] flex flex-col md:flex-row items-stretch gap-2 max-w-3xl border border-white">
                <div className="flex-1 flex items-center px-4 py-3 bg-slate-50 rounded-xl group focus-within:bg-white transition-all">
                  <span className="material-symbols-outlined text-slate-400 mr-3">medical_services</span>
                  <input 
                    className="bg-transparent border-none focus:ring-0 w-full text-on-surface placeholder:text-slate-400 text-sm sm:text-base" 
                    placeholder="Search Specialists or Symptoms" 
                    type="text" 
                  />
                </div>
                <div className="flex-1 flex items-center px-4 py-3 bg-slate-50 rounded-xl group focus-within:bg-white transition-all">
                  <span className="material-symbols-outlined text-slate-400 mr-3">location_on</span>
                  <input 
                    className="bg-transparent border-none focus:ring-0 w-full text-on-surface placeholder:text-slate-400 text-sm sm:text-base" 
                    placeholder="Location or Virtual" 
                    type="text" 
                  />
                </div>
                <button className="bg-[#001836] bg-gradient-to-br from-[#001836] to-[#002d5b] text-white px-8 py-3 rounded-xl font-semibold shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-transform">
                  Find Care
                </button>
              </div>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl">
                {trustMetrics.map((metric, index) => (
                  <div key={metric.label} className={`reveal rounded-xl border border-blue-100 bg-white/70 px-4 py-3 backdrop-blur-sm ${index === 1 ? 'delay-1' : ''} ${index === 2 ? 'delay-2' : ''}`}>
                    <p className="text-lg font-extrabold text-blue-950 tracking-tight">{metric.value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{metric.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-5 relative reveal delay-1">
              <div className="aspect-[4/5] rounded-[2rem] overflow-hidden shadow-[0_36px_80px_-30px_rgba(2,6,23,0.5)] relative z-10">
                <img 
                  className="w-full h-full object-cover" 
                  alt="Minimalist modern medical office" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBFVj6HNulvfaryHnoVqOzP9JDuQ_xUg6wabUn0FaNsSPakQ-Hkc5itVVzpCWZPCcE9YW911gJkXb_mzMfuQClSS79ucD7oivni1AOJj3g8wQO7lTsTk4a2mK6_2tO0re6H6rHampg6HAlS93p5wrxzze_jGAXerx5sVLDGjZcJuqk6OTZJPxxbvoantnwG0cqB7i-Uo2ly3yeHdQ2wg3FQFwoj4NUEKk0EjYzzzvuGhtQxvN50BvSHWaF50CfoZi5vmjEat-gsAoc" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#001836]/40 to-transparent"></div>
              </div>
              {/* Decorative Elements */}
              <div className="absolute -top-12 -right-12 w-64 h-64 bg-blue-100 rounded-full blur-[80px] opacity-50 -z-10"></div>
              <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-cyan-200 rounded-full blur-[70px] opacity-40 -z-10"></div>
            </div>
          </div>
        </section>

        {/* Value Proposition */}
        <section className="py-24 bg-slate-50">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="reveal flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-16">
              <div className="max-w-2xl">
                <h2 className="font-headline text-4xl font-bold tracking-tight text-primary mb-4">Complete Care, Anywhere.</h2>
                <p className="text-secondary">We've removed the noise of modern medicine to focus on what matters: your journey to recovery.</p>
              </div>
              <div className="hidden md:block">
                <button className="text-primary font-bold text-sm border-b-2 border-blue-200 pb-1 hover:border-primary transition-all">VIEW ALL SERVICES</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* High Impact Video Highlight Card */}
              <div className="reveal md:col-span-2 bg-white rounded-2xl p-8 flex flex-col justify-between shadow-sm border border-slate-100 min-h-[400px] hover:shadow-xl transition-shadow duration-300">
                <div>
                  <span className="material-symbols-outlined text-primary mb-6 text-4xl">videocam</span>
                  <h3 className="font-headline text-2xl font-bold text-primary mb-4">Seamless Video Consultations</h3>
                  <p className="text-slate-600 max-w-md">Connect with world-class specialists in 4K resolution. Our encrypted platform ensures your privacy remains a sanctuary.</p>
                </div>
                <div className="mt-8 flex items-center gap-4">
                  <div className="flex -space-x-3">
                    {doctorAvatars.map((avatar, i) => (
                      <img 
                        key={avatar}
                        className="w-10 h-10 rounded-full ring-4 ring-white" 
                        alt={`Doctor headshot ${i + 1}`}
                        src={avatar}
                      />
                    ))}
                  </div>
                  <p className="text-sm font-medium text-secondary">500+ Board-certified specialists online</p>
                </div>
              </div>

              {/* Compact Info Cards */}
              <div className="reveal delay-1 bg-[#001836] bg-gradient-to-br from-[#001836] to-[#002d5b] rounded-2xl p-8 flex flex-col justify-between text-white shadow-sm hover:shadow-xl transition-shadow duration-300">
                <span className="material-symbols-outlined text-blue-200 text-4xl">calendar_month</span>
                <div>
                  <h3 className="font-headline text-xl font-bold mb-2">Instant Scheduling</h3>
                  <p className="text-blue-100/70 text-sm">Book top-tier care in under 60 seconds with our zero-friction interface.</p>
                </div>
              </div>

              <div className="reveal delay-1 bg-white rounded-2xl p-8 flex flex-col justify-between shadow-sm border border-slate-100 hover:shadow-xl transition-shadow duration-300">
                <span className="material-symbols-outlined text-primary text-4xl">history_edu</span>
                <div>
                  <h3 className="font-headline text-xl font-bold text-primary mb-2">Health Records</h3>
                  <p className="text-slate-600 text-sm">Your entire clinical history, unified and beautifully presented for total clarity.</p>
                </div>
              </div>

              <div className="reveal delay-2 md:col-span-2 bg-blue-50/60 rounded-2xl p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8 border border-white shadow-sm hover:shadow-xl transition-shadow duration-300">
                <div className="w-32 h-32 flex-shrink-0 bg-white rounded-xl shadow-sm flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-5xl">monitoring</span>
                </div>
                <div>
                  <h3 className="font-headline text-xl font-bold text-primary mb-2">Real-time Vitals Monitoring</h3>
                  <p className="text-slate-600 text-sm">Integrated wearable data syncs directly with your care team for proactive health management.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonial Section */}
        <section className="py-32 bg-white">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-14 lg:gap-20 items-center">
              <div className="relative reveal">
                <div className="aspect-square bg-slate-100 rounded-[2rem] overflow-hidden shadow-lg">
                  <img 
                    className="w-full h-full object-cover grayscale contrast-125" 
                    alt="Medical instruments" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDT8FPCuxdO0p1NlykPT6HOlRr96RsSkw0qlOQXzzjWoD_NXKXNKqu3zBNLDBYed3-_eZpIZCQes50bIREo6oiAPDNb3wGklXOdLWpGpbhB6ndk8MzmWlOikxNNXp9CyRCo0p_wOyo_un3ckDZZlHdK9x9bfqoZYH3f8WePYt8Yph1eQVv2ZPedvtJmiBMEFW5dPfsOGgb7pmGqZlpsHTbQTGnDc4NSj3c2zAi-3REmZdaWPodWvuKkdu0-5SgHTJp9jXYZg3RapjI" 
                  />
                </div>
                <div className="absolute -bottom-10 right-4 sm:right-8 md:-right-10 bg-white/75 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-xl max-w-xs border border-white/80">
                  <span className="material-symbols-outlined text-primary text-4xl mb-4">format_quote</span>
                  <p className="text-primary font-medium italic mb-4 leading-relaxed">
                    "Nexus Health didn't just give me an appointment; they gave me peace of mind in a chaotic time."
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100"></div>
                    <div>
                      <p className="text-sm font-bold text-primary">Elena Rodriguez</p>
                      <p className="text-xs text-secondary">Patient since 2022</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pl-0 md:pl-12 reveal delay-1">
                <h2 className="font-headline text-4xl font-bold tracking-tight text-primary mb-8">Trust in the <br />Architectural Approach.</h2>
                <div className="space-y-12">
                  {[
                    { id: '01', title: 'Absolute Privacy', desc: 'Our platform exceeds HIPAA standards, treating your data with the same reverence as your health.' },
                    { id: '02', title: 'Curated Experts', desc: 'Every specialist on Nexus Health is vetted for clinical excellence and bedside manner.' },
                    { id: '03', title: 'Human Centricity', desc: 'Technology that serves the patient, never the other way around.' }
                  ].map((item) => (
                    <div key={item.id} className="flex gap-6">
                      <div className="text-4xl font-light text-blue-900/30">{item.id}</div>
                      <div>
                        <h4 className="font-headline text-xl font-bold text-primary mb-2">{item.title}</h4>
                        <p className="text-secondary leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-screen-2xl mx-auto">
            <div className="reveal bg-[#001836] bg-gradient-to-br from-[#001836] to-[#002d5b] rounded-3xl p-10 sm:p-12 lg:p-16 text-center text-white relative overflow-hidden shadow-[0_34px_80px_-35px_rgba(0,24,54,0.8)]">
              <div className="absolute inset-0 opacity-10">
                <img 
                  className="w-full h-full object-cover" 
                  alt="Abstract background" 
                  src="/images/cta-pattern.svg" 
                />
              </div>
              <div className="relative z-10">
                <h2 className="font-headline text-4xl sm:text-5xl font-bold mb-6 tracking-tight">Begin Your Healing Journey.</h2>
                <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">Join the new standard of premium healthcare. Experience the Nexus difference today.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button className="bg-white text-[#001836] px-10 py-4 rounded-lg font-bold hover:bg-blue-50 hover:-translate-y-0.5 active:translate-y-0 transition-transform">Create Account</button>
                  <Link
                    to={user ? "/patient/add-appointment" : "/login"}
                    className="border border-white/30 text-white px-10 py-4 rounded-lg font-bold hover:bg-white/10 hover:-translate-y-0.5 transition-transform"
                      >
                     Schedule Consultation
                  </Link> 
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-100 font-inter text-sm tracking-wide w-full py-12">
        <div className="flex flex-col md:flex-row justify-between items-center px-4 sm:px-6 lg:px-8 max-w-screen-2xl mx-auto gap-6">
          <div className="flex flex-col gap-2">
            <span className="font-headline font-bold text-blue-950 text-xl">Nexus Health</span>
            <p className="text-slate-500">© 2024 Nexus Health. The Architectural Healer.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-5 sm:gap-8 text-slate-500">
            <a className="hover:text-blue-700 transition-colors" href="/#privacy-policy">Privacy Policy</a>
            <a className="hover:text-blue-700 transition-colors" href="/#terms-of-service">Terms of Service</a>
            <a className="hover:text-blue-700 transition-colors" href="/#hipaa-compliance">HIPAA Compliance</a>
            <a className="hover:text-blue-700 transition-colors" href="/#contact">Contact</a>
          </div>
          <div className="flex gap-4">
            <span className="material-symbols-outlined text-slate-400 hover:text-blue-900 cursor-pointer transition-colors">share</span>
            <span className="material-symbols-outlined text-slate-400 hover:text-blue-900 cursor-pointer transition-colors">language</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NexusHealth;