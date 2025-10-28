import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiShield, 
  FiHeart, 
  FiActivity, 
  FiUsers, 
  FiCheckCircle, 
  FiArrowRight, 
  FiMenu,
  FiInfo,
  FiHelpCircle,
  FiFileText,
  FiFacebook,
  FiTwitter,
  FiInstagram,
  FiLinkedin,
  FiHome,
  // FiBuilding,
  FiMapPin,
  FiStar,
  FiSmartphone,
  FiTablet,
  FiMonitor
} from 'react-icons/fi';
import Logo from './Logo';

const HEADROOM_OFFSET = 80; // px you have to scroll down before hiding
const useHeadroom = () => {
  const [state, setState] = React.useState<'pinned' | 'unpinned'>('pinned');

  React.useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastY;

      // scrolling up or near the top → always pin
      if (currentY <= HEADROOM_OFFSET || delta < 0) {
        setState('pinned');
      } else if (delta > 0 && currentY > HEADROOM_OFFSET) {
        setState('unpinned');
      }

      lastY = currentY;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return state;
};

// Typewriter component
const Typewriter: React.FC<{ words: string[] }> = ({ words }) => {
  const [index, setIndex] = React.useState(0);
  const [subIndex, setSubIndex] = React.useState(0);
  const [blink, setBlink] = React.useState(true);
  const [reverse, setReverse] = React.useState(false);

  // Typewriter effect
  React.useEffect(() => {
    if (subIndex === words[index].length + 1 && !reverse) {
      setReverse(true);
      return;
    }
    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % words.length);
      return;
    }

    const timeout = setTimeout(
      () => {
        setSubIndex((prev) => prev + (reverse ? -1 : 1));
      },
      reverse ? 75 : subIndex === words[index].length ? 1500 : 100
    );

    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse, words]);

  // Blinking cursor
  React.useEffect(() => {
    const blinkTimeout = setInterval(() => setBlink((prev) => !prev), 500);
    return () => clearInterval(blinkTimeout);
  }, []);

  return (
    <>
      {words[index].substring(0, subIndex)}
      <span className={`inline-block w-0.5 h-8 ml-1 align-middle bg-green-600 ${blink ? 'opacity-100' : 'opacity-0'} transition-opacity`} />
    </>
  );
};

const PatientPassportLanding = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const headroomState = useHeadroom();


  const features = [
    {
      icon: FiShield,
      title: "Secure Medical Records",
      description: "Keep all your sensitive health data protected with state-of-the-art encryption and privacy controls."
    },
    {
      icon: FiHeart,
      title: "Personalized Health Insights",
      description: "Gain a deeper understanding of your health with clear visualizations and actionable insights from your data."
    },
    {
      icon: FiActivity,
      title: "Intelligent Medication Tracking",
      description: "Manage prescriptions, set reminders, and track adherence with medication schedules made effortless."
    },
    {
      icon: FiUsers,
      title: "Seamless Doctor Collaboration",
      description: "Share your passport records with healthcare providers for better communication and coordinated care."
    }
  ];

  const benefits = [
    "Access your records anytime, anywhere",
    "Share securely with any healthcare provider",
    "Track your health journey over time",
    "Stay on top of medications and appointments"
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
<header
        className={`
          fixed inset-x-0 top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200
          transition-transform duration-300 ease-out
          ${headroomState === 'pinned' ? 'translate-y-0' : '-translate-y-full'}
        `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-3">
          <a href="/" className="group">
            <Logo size="md" className="group-hover:shadow-lg transition-all" />
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-3">
            <button onClick={() => navigate("/")} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Home
            </button>
            <div className="flex items-center px-1 py-0.5 border rounded-md border-slate-400 justify-between gap-4">
              <button onClick={() => navigate("/patient-register")} className="ml-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Register
            </button>
            <button onClick={() => navigate("/patient-login")} className="px-6 py-1.5 bg-green-500 text-sm font-medium text-white hover:text-white hover:bg-green-600 rounded transition-colors">
              Login
            </button>
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-1.5" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <FiMenu className="w-5 h-5 text-slate-700" />
          </button>
        </div>

        {/* Mobile Menu – stays inside the header so it moves with it */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <nav className="flex flex-col p-3 space-y-1">
              <button onClick={() => { navigate("/"); setMobileMenuOpen(false); }} className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded text-left">
                Home
              </button>
              <button onClick={() => { navigate("/patient-register"); setMobileMenuOpen(false); }} className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded text-left">
                Register
              </button>
              <button onClick={() => { navigate("/patient-login"); setMobileMenuOpen(false); }} className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded text-left">
                Login
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Spacer for fixed header */}
      <div className="h-20 md:h-16" />

      {/* ==================== HERO ==================== */}
      <section className="relative bg-gradient-to-br from-green-50 via-white to-slate-50 overflow-hidden md:px-4">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 relative">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

            {/* LEFT – copy (unchanged) */}
            <div className="space-y-6 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-100">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-slate-900">Join 10,000+ patients already in control</span>
              </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
                  Take control of your health.{" "}
                  <span className="inline-block min-w-[180px]">
                    <span className="bg-gradient-to-r from-green-600 via-green-700 to-green-600 bg-clip-text text-transparent">
                      <Typewriter words={["Finally.", "Anywhere.", "Anytime.", "Conveniently."]} />
                    </span>
                  </span>
                </h1>

              <p className="text-lg text-slate-600 max-w-xl">
                All your medical records in one place. Access them anywhere. Share with any doctor. 
                It's that simple.
              </p>

              <div className="flex flex-wrap gap-3">
                <button onClick={() => navigate("/patient-register")}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 shadow-lg hover:shadow-xl flex items-center gap-2 transition-all">
                  Get Started Free <FiArrowRight className="w-4 h-4" />
                </button>
                <button onClick={() => navigate("/patient-login")}
                  className="px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg font-medium hover:bg-slate-50 transition-all">
                  Sign In
                </button>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-green-200 shadow-sm">
                <p className="text-sm font-medium text-slate-900 mb-2">Are you a Healthcare Provider?</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => navigate("/hospital-login")} className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-sm text-white font-medium rounded-lg hover:border-green-400 transition-all">
                    Hospital Login
                  </button>
                  <button onClick={() => navigate("/hospital-register")} className="px-3 py-1.5 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-50 transition-all">
                    Hospital Register
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT – NEW MODERN MOCKUP */}
            <div className="relative flex justify-center lg:justify-end animate-fade-in-delayed">
              <div className="relative w-full max-w-md">

                {/* Glowing background orb */}
                <div className="absolute inset-0 -translate-x-12 translate-y-12 w-64 h-64 bg-green-400/30 rounded-full blur-3xl animate-pulse" />
                <div className="absolute inset-0 translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-400/30 rounded-full blur-3xl animate-pulse animation-delay-1000" />

                {/* Phone (main device) */}
                <div className="relative z-10 mx-auto w-48 sm:w-56 lg:w-72 transform transition-all duration-500 hover:scale-105">
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-1 shadow-2xl">
                    <div className="bg-white rounded-3xl p-4 flex flex-col items-center space-y-3">
                      <FiSmartphone className="w-12 h-12 text-green-600" />
                      <div className="w-full h-2 bg-green-100 rounded-full" />
                      <div className="w-full h-2 bg-green-200 rounded-full" />
                      <div className="w-full h-2 bg-green-300 rounded-full" />
                      <p className="text-xs font-medium text-slate-700">Your Passport</p>
                    </div>
                  </div>
                </div>

                {/* Tablet (floating left) */}
                <div className="absolute top-12 -left-12 w-32 sm:w-40 lg:w-56 transform -rotate-12 transition-all duration-500 hover:rotate-0 hover:z-10">
                  <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-1 shadow-xl">
                    <div className="bg-white rounded-2xl p-3 flex flex-col items-center space-y-2">
                      <FiTablet className="w-8 h-8 text-emerald-600" />
                      <div className="grid grid-cols-2 gap-1 w-full">
                        <div className="h-2 bg-emerald-100 rounded-full" />
                        <div className="h-2 bg-emerald-200 rounded-full" />
                        <div className="h-2 bg-emerald-300 rounded-full" />
                        <div className="h-2 bg-emerald-100 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desktop card (floating right) */}
                <div className="absolute -top-4 -right-8 w-36 sm:w-44 lg:w-52 transform rotate-6 transition-all duration-500 hover:rotate-0 hover:z-10">
                  <div className="bg-gradient-to-br from-slate-700 to-slate-600 rounded-xl p-1 shadow-xl">
                    <div className="bg-white rounded-xl p-3 flex flex-col items-center space-y-2">
                      <FiMonitor className="w-9 h-9 text-green-600" />
                      <div className="w-full h-1.5 bg-green-100 rounded-full" />
                      <div className="w-full h-1.5 bg-green-200 rounded-full" />
                      <p className="text-xs font-medium text-slate-600">Provider Portal</p>
                    </div>
                  </div>
                </div>

                {/* Floating health icons */}
                <div className="absolute top-4 left-6 animate-bounce">
                  <FiHeart className="w-6 h-6 text-pink-500" />
                </div>
                <div className="absolute bottom-8 right-4 animate-bounce animation-delay-500">
                  <FiShield className="w-6 h-6 text-green-600" />
                </div>
                <div className="absolute top-20 right-24 z-10 animate-bounce animation-delay-1000">
                  <FiActivity className="w-6 h-6 text-emerald-600" />
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative py-16 sm:py-20 bg-gradient-to-b from-white to-green-50 overflow-hidden">
        {/* Floating Orbs */}
        <div className="absolute top-20 -left-20 w-72 h-72 bg-green-100 rounded-full blur-3xl opacity-30 animate-pulse" />
        <div className="absolute bottom-20 -right-20 w-80 h-80 bg-emerald-100 rounded-full blur-3xl opacity-30 animate-pulse animation-delay-2000" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Header */}
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Everything you need,<br />
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                nothing you don't
              </span>
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Built for real people dealing with real health challenges - simple, secure, and always in your control.
            </p>
          </div>

          {/* Staggered Grid */}
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className={`
                  group relative p-4 rounded-2xl bg-white border border-slate-200
                  hover:border-green-300 hover:shadow-xl transition-all duration-300
                  transform hover:-translate-y-1
                  ${index % 2 === 1 ? 'lg:mt-0' : 'lg:mt-0'}
                  animate-fade-in-up
                `}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {/* Gradient Accent */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-50 to-transparent opacity-0 group-hover:opacity-50 transition-opacity" />

                <div className="relative flex items-start gap-4">
                  {/* Animated Checkmark Badge */}
                  <div className="flex-shrink-0 relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                      <FiCheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 blur-lg opacity-50 scale-150 animate-pulse" />
                  </div>

                  {/* Text */}
                  <div className="flex-1">
                    <p className="text-lg font-medium text-slate-900 leading-relaxed">
                      {benefit}
                    </p>
                  </div>
                </div>

                {/* Subtle hover line */}
                <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>

          {/* Trust Indicator */}
          <div className="mt-12 text-center">
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-green-600">10,000+</span> patients trust their health data with us
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-3">
              Features that actually matter
            </h2>
            <p className="text-lg text-slate-600">
              No fluff. Just what you need to stay healthy.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group"
                >
                  <div className="h-full p-4 sm:p-6 rounded-xl bg-white border border-slate-200 hover:border-green-300 hover:shadow-lg transition-all">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                      <Icon className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

    {/* Trust Section */}
    <section className="py-16 sm:py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Headline */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-3">
            Trusted by healthcare providers<br className="hidden sm:block" /> across the country
          </h2>
          <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto">
            From local clinics to national networks — your data is in safe hands.
          </p>

          {/* Icon Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-12">
            {[
              { icon: FiHome, label: "Hospitals", color: "green" },
              { icon: FiUsers, label: "Clinics", color: "blue" },
              { icon: FiHeart, label: "Medical Centers", color: "purple" },
              { icon: FiMapPin, label: "Healthcare Networks", color: "orange" }
            ].map(({ icon: Icon, label, color }, index) => (
              <div
                key={index}
                className="group flex flex-col items-center gap-3 cursor-default transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`
                  w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center
                  bg-white shadow-md ring-1 ring-slate-200
                  group-hover:shadow-xl group-hover:ring-2 group-hover:ring-${color}-500
                  transition-all duration-300
                `}>
                  <Icon className={`w-8 h-8 sm:w-10 sm:h-10 text-${color}-600`} />
                </div>
                <span className="text-sm sm:text-base font-semibold text-slate-700">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Trust Stat */}
          <div className="mt-12 pt-8 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              <span className="text-2xl font-bold text-green-600">10,000+</span> patients
              {" "}&bull;{" "}
              <span className="text-2xl font-bold text-blue-600">500+</span> providers
            </p>
          </div>
        </div>
      </div>
    </section>

      {/* CTA Section */}
      <section className="relative py-16 sm:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-emerald-800" />
        {/* <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:14px_24px]" /> */}
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-4">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
              Start taking control today
            </h2>
            <p className="text-base sm:text-lg text-emerald-100 max-w-xl mx-auto">
              Free to start. No credit card needed. Takes less than 2 minutes.
            </p>
            <button 
              onClick={() => navigate("/patient-register")}
              className="px-5 py-2.5 bg-white text-emerald-600 rounded-lg font-medium hover:bg-emerald-50 shadow-xl hover:shadow-2xl transition-all inline-flex items-center gap-2"
            >
              Create your free account
              <FiArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="flex items-center justify-between gap-8 lg:gap-10">

            {/* Logo & Tagline */}
            <div className="lg:col-span-1">
              <Logo size="lg" className="mb-4" />
              <p className="text-sm text-slate-600 max-w-xs">
                Your secure digital health passport - accessible anytime, anywhere.
              </p>
              <div className="flex items-center gap-2 mt-4">
                <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                  HIPAA Compliant
                </div>
                <div className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                  SOC 2 Certified
                </div>
              </div>
            </div>

            {/* Support & Legal */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-slate-600 hover:text-green-600 transition-colors flex items-center gap-2">
                    <FiHelpCircle className="w-3.5 h-3.5" /> Help Center
                  </a></li>
                <li><a href="#" className="text-slate-600 hover:text-green-600 transition-colors">Live Chat</a></li>
                <li><a href="mailto:support@patientpassport.com" className="text-slate-600 hover:text-green-600 transition-colors">
                    support@patientpassport.com
                  </a></li>
                <li><a href="tel:+250795019913" className="text-slate-600 hover:text-green-600 transition-colors">
                    +250 795 019 913
                  </a></li>
              </ul>
            </div>

            {/* Newsletter + Social */}
            <div className="lg:col-span-1">
              <h3 className="font-semibold text-slate-900 mb-4">Stay Updated</h3>
              <p className="text-sm text-slate-600 mb-3">
                Get health tips and product updates.
              </p>
              <form className="flex flex-col sm:flex-row gap-2 mb-4">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <button className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap">
                  Subscribe
                </button>
              </form>

              {/* Social Icons */}
              <div className="flex items-center gap-2">
                <a href="#" className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-green-600 hover:border-green-300 transition-all">
                  <FiFacebook className="w-4 h-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-green-600 hover:border-green-300 transition-all">
                  <FiTwitter className="w-4 h-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-green-600 hover:border-green-300 transition-all">
                  <FiInstagram className="w-4 h-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-green-600 hover:border-green-300 transition-all">
                  <FiLinkedin className="w-4 h-4" />
                </a>
              </div>

              {/* App Badges */}
              {/* <div className="flex gap-2 mt-4">
                <a href="#" className="block">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge.svg" alt="Get it on Google Play" className="h-9" />
                </a>
                <a href="#" className="block">
                  <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="Download on the App Store" className="h-9" />
                </a>
              </div> */}
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-10 pt-8 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
            <p>© {new Date().getFullYear()} PatientPassport, Inc. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-green-600 transition-colors flex items-center gap-1">
                <FiFileText className="w-3.5 h-3.5" /> Privacy Policy
              </a>
              <a href="#" className="hover:text-green-600 transition-colors flex items-center gap-1">
                <FiFileText className="w-3.5 h-3.5" /> Terms of Service
              </a>
              <a href="#" className="hover:text-green-600 transition-colors">Cookie Settings</a>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
          @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-fade-in-delayed {
          animation: fade-in 0.6s ease-out 0.2s both;
        }
      `}</style>
    </div>
  );
};

export default PatientPassportLanding;