import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Heart, Activity, Users, CheckCircle, ArrowRight, Menu } from 'lucide-react';
import Logo from './Logo';

const PatientPassportLanding = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const features = [
    {
      icon: Shield,
      title: "Secure Medical Records",
      description: "Keep all your sensitive health data protected with state-of-the-art encryption and privacy controls."
    },
    {
      icon: Heart,
      title: "Personalized Health Insights",
      description: "Gain a deeper understanding of your health with clear visualizations and actionable insights from your data."
    },
    {
      icon: Activity,
      title: "Intelligent Medication Tracking",
      description: "Manage prescriptions, set reminders, and track adherence with medication schedules made effortless."
    },
    {
      icon: Users,
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
    <div className="app-container bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="page-container flex items-center justify-between py-4">
          <a href="/" className="group">
            <Logo size="md" className="group-hover:shadow-lg transition-all" />
          </a>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4">
            <button 
              onClick={() => navigate("/")} 
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Home
            </button>
            <button 
              onClick={() => navigate("/patient-register")} 
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Register
            </button>
            <button 
              onClick={() => navigate("/patient-login")} 
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
            >
              Login
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="w-6 h-6 text-slate-700" />
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <nav className="flex flex-col p-4 space-y-2">
              <button 
                onClick={() => { navigate("/"); setMobileMenuOpen(false); }} 
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded text-left"
              >
                Home
              </button>
              <button 
                onClick={() => { navigate("/patient-register"); setMobileMenuOpen(false); }} 
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded text-left"
              >
                Register
              </button>
              <button 
                onClick={() => { navigate("/patient-login"); setMobileMenuOpen(false); }} 
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded text-left"
              >
                Login
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="section-container relative bg-gradient-to-br from-green-50 via-white to-slate-50 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
        <div className="page-container relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-100">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-slate-900">Join 10,000+ patients already in control</span>
              </div>
              
              <h1 className="heading-xl text-slate-900 leading-tight">
                Take control of your health.{" "}
                <span className="bg-gradient-to-r from-green-600 via-green-700 to-green-600 bg-clip-text text-transparent">
                  Finally.
                </span>
              </h1>
              
              <p className="body-lg text-slate-600 max-w-xl">
                All your medical records in one place. Access them anywhere. Share with any doctor. 
                It's that simple.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => navigate("/patient-register")}
                  className="btn-primary shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => navigate("/patient-login")}
                  className="btn-secondary border border-slate-300 hover:border-slate-400"
                >
                  Sign In
                </button>
              </div>

              <div className="mt-8 p-6 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 shadow-sm">
                <p className="text-sm font-medium text-slate-900 mb-3">Healthcare Provider?</p>
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={() => navigate("/hospital-login")}
                    className="px-4 py-2 text-sm font-medium border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-green-400 transition-all"
                  >
                    Hospital Login
                  </button>
                  <button 
                    onClick={() => navigate("/hospital-register")}
                    className="px-4 py-2 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-50 transition-all"
                  >
                    Hospital Register
                  </button>
                </div>
              </div>
            </div>

            <div className="relative animate-fade-in-delayed">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=600&fit=crop" 
                  alt="Modern healthcare dashboard" 
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    const nextSibling = target.nextSibling as HTMLElement;
                    target.style.display = 'none';
                    if (nextSibling) nextSibling.style.display = 'flex';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-green-600/20 to-transparent" />
                {/* Fallback if image fails to load */}
                <div className="hidden aspect-[4/3] items-center justify-center bg-gradient-to-br from-green-100 to-slate-100">
                  <div className="text-center p-8">
                    <Shield className="w-24 h-24 text-green-600 mx-auto mb-4" />
                    <p className="text-slate-700 font-medium">Your Health Dashboard</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-green-400/20 rounded-full blur-3xl" />
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-green-500/20 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-3">
              Everything you need, nothing you don't
            </h2>
            <p className="body-lg text-slate-600 max-w-2xl mx-auto">
              Built for real people dealing with real health challenges
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="dashboard-card flex items-start gap-3 border border-slate-200 hover:border-green-300 hover:shadow-md transition-all group"
              >
                <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded flex items-center justify-center mt-0.5 group-hover:bg-green-200 transition-colors">
                  <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                </div>
                <p className="body-md text-slate-900">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-container bg-slate-50">
        <div className="page-container">
          <div className="text-center mb-14">
            <h2 className="heading-lg text-slate-900 mb-3">
              Features that actually matter
            </h2>
            <p className="body-lg text-slate-600">
              No fluff. Just what you need to stay healthy.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group"
                >
                  <div className="h-full p-6 rounded-xl bg-white border border-slate-200 hover:border-green-300 hover:shadow-lg transition-all">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-5 group-hover:bg-green-200 transition-colors">
                      <Icon className="w-6 h-6 text-green-600" />
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
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <p className="text-sm text-slate-600 mb-8 font-medium">
              Trusted by healthcare providers across the country
            </p>
            <div className="flex items-center justify-center gap-8 opacity-20">
              <div className="w-12 h-12 bg-slate-300 rounded" />
              <div className="w-12 h-12 bg-slate-300 rounded-full" />
              <div className="w-12 h-12 bg-slate-300 rounded" />
              <div className="w-12 h-12 bg-slate-300 rounded-full" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-emerald-800" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:14px_24px]" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="space-y-6">
            <h2 className="text-3xl lg:text-5xl font-bold text-white leading-tight">
              Start taking control today
            </h2>
            <p className="text-lg text-emerald-100 max-w-xl mx-auto">
              Free to start. No credit card needed. Takes less than 2 minutes.
            </p>
            <button 
              onClick={() => navigate("/patient-register")}
              className="px-6 py-3 bg-white text-emerald-600 rounded-lg font-medium hover:bg-emerald-50 shadow-xl hover:shadow-2xl transition-all inline-flex items-center gap-2"
            >
              Create your free account
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <Logo size="md" />
            
            <div className="flex items-center gap-8">
              <a href="#" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                About
              </a>
              <a href="#" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                Support
              </a>
              <a href="#" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                Legal
              </a>
            </div>
            
            <div className="flex items-center gap-4">
              {[1, 2, 3, 4].map((i) => (
                <a 
                  key={i}
                  href="#" 
                  className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-600 transition-all"
                >
                  <div className="w-5 h-5 bg-current rounded-full opacity-40" />
                </a>
              ))}
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-600">
              © 2025 PatientPassport. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <style>{`
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