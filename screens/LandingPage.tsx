
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Icon } from '../components/Icon';
import { CarniBotIcon } from '../components/CarniBotIcon';
import ParticleBackground from '../components/ParticleBackground';
import { supabase } from '../supabaseClient';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scrollY, setScrollY] = useState(0);
  const [showGeneticsModal, setShowGeneticsModal] = useState(false);
  const [purchaseModal, setPurchaseModal] = useState<{ show: boolean, plan: 'pro' | 'elite' | null }>({ show: false, plan: null });
  const [purchaseEmail, setPurchaseEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Typewriter Effect State
  const fullText = "Cultiva el Futuro Genético";
  const [typedText, setTypedText] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);

  // Auto-redirect if logged in
  useEffect(() => {
    if (user?.isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Typewriter Logic
  useEffect(() => {
    let index = 0;
    const typeInterval = setInterval(() => {
      if (index <= fullText.length) {
        setTypedText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(typeInterval);
      }
    }, 100);

    const cursorInterval = setInterval(() => {
      setCursorVisible(v => !v);
    }, 500);

    return () => {
      clearInterval(typeInterval);
      clearInterval(cursorInterval);
    };
  }, []);

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseEmail || !purchaseModal.plan) return;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('mercadopago-checkout', {
        body: {
          plan_id: purchaseModal.plan,
          user_id: 'NEW',
          user_email: purchaseEmail
        }
      });

      if (error) throw error;
      if (data?.init_point) {
        window.location.href = data.init_point;
      }
    } catch (err) {
      console.error("Error al iniciar compra:", err);
      alert("Hubo un error al conectar con la pasarela de pago.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050b14] text-white font-sans overflow-x-hidden selection:bg-teal-500 selection:text-white relative">

      {/* --- BACKGROUND LAYERS --- */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: "url('/organic_bg.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      />

      {/* 2. Gradient Overlay for readability (Lighter) */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#050b14]/70 via-[#050b14]/40 to-[#050b14]/90 pointer-events-none z-0" />

      {/* 3. Spores/Particles (Subtle) */}
      <div className="opacity-30">
        <ParticleBackground />
      </div>

      {/* --- NABVAR --- */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrollY > 50 ? 'bg-[#050b14]/80 backdrop-blur-xl border-b border-white/5' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500/80 to-emerald-600/80 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg shadow-teal-900/40 border border-white/10 group cursor-pointer">
              <CarniBotIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white/90">CarniLab</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            {['Características', 'Genética', 'Planes'].map((item) => (
              <button key={item} className="hover:text-teal-300 transition-colors relative group">
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-teal-400 transition-all duration-300 group-hover:w-full" />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/login')} className="hidden md:block text-sm font-bold text-white hover:text-teal-300 transition-colors">
              Ingresar
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2.5 bg-teal-600/20 border border-teal-500/50 hover:bg-teal-600/40 backdrop-blur-md rounded-full text-sm font-bold text-teal-100 transition-all duration-300 shadow-[0_0_15px_rgba(20,184,166,0.2)] hover:shadow-[0_0_25px_rgba(20,184,166,0.4)]"
            >
              Comenzar
            </button>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden z-10 flex flex-col items-center justify-center min-h-[85vh]">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-900/30 border border-teal-500/30 backdrop-blur-md mb-8 animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse shadow-[0_0_10px_#2dd4bf]" />
            <span className="text-xs font-bold tracking-widest text-teal-300 uppercase">Tecnología Botánica Avanzada</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1] mb-8 min-h-[1.1em]">
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-400 drop-shadow-lg">
              {typedText}
            </span>
            <span className={`${cursorVisible ? 'opacity-100' : 'opacity-0'} text-teal-400 font-light ml-1 transition-opacity duration-100`}>|</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300/90 max-w-2xl mx-auto mb-12 leading-relaxed font-light tracking-wide animate-fade-in-up delay-300">
            Gestiona el genoma de tu colección. Identifica clones, rastrea linajes y optimiza tus cultivos con la plataforma de investigación definitiva.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-fade-in-up delay-500">
            <button
              onClick={() => navigate('/login')}
              className="group h-14 px-8 rounded-full bg-white text-slate-900 font-bold text-lg hover:bg-slate-100 transition-all flex items-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.15)] overflow-hidden relative"
            >
              <span className="relative z-10">Abrir Laboratorio</span>
              <Icon name="science" className="text-teal-700 relative z-10 group-hover:rotate-12 transition-transform" />
            </button>
            <button
              onClick={() => setShowGeneticsModal(true)}
              className="h-14 px-8 rounded-full bg-white/5 border border-white/10 text-white/90 font-bold text-lg hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-3 backdrop-blur-md group"
            >
              <Icon name="dna" className="text-purple-400 group-hover:scale-110 transition-transform" />
              Explorar Genética
            </button>
          </div>
        </div>
      </section>

      {/* --- LIVE STATS --- */}
      <section className="relative z-10 py-10 border-y border-white/5 bg-[#050b14]/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: 'Plantas Gestionadas', value: '+1,200', icon: 'local_florist', color: 'text-teal-400' },
            { label: 'Cruzas Registradas', value: '450', icon: 'hub', color: 'text-purple-400' },
            { label: 'Cultivadores', value: '85', icon: 'group', color: 'text-amber-400' },
            { label: 'Especies', value: '32', icon: 'category', color: 'text-emerald-400' }
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center gap-2 group cursor-default">
              <Icon name={stat.icon} className={`text-3xl ${stat.color} opacity-80 group-hover:scale-110 transition-transform duration-300`} />
              <span className="text-3xl md:text-4xl font-bold text-white tracking-tight">{stat.value}</span>
              <span className="text-xs uppercase tracking-widest text-slate-500 font-bold">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* --- INVENTORY SHOWCASE (FICHA VIVA) --- */}
      <section className="relative z-10 py-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 space-y-6">
            <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
              Tu Colección,<br />
              <span className="text-teal-400">Nivel Profesional.</span>
            </h2>
            <p className="text-slate-400 text-lg">
              Deja de usar libretas de papel. CarniLab genera fichas técnicas vivas de cada espécimen,
              rastreando edad, origen y salud histórica.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="bg-slate-900/50 p-4 rounded-xl border border-white/10 flex items-center gap-3 hover:bg-slate-900/80 transition-colors">
                <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400">
                  <Icon name="qr_code" />
                </div>
                <div className="text-sm">
                  <strong className="block text-white">Etiquetado QR</strong>
                  <span className="text-slate-500">Acceso instantáneo</span>
                </div>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-white/10 flex items-center gap-3 hover:bg-slate-900/80 transition-colors">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                  <Icon name="history_edu" />
                </div>
                <div className="text-sm">
                  <strong className="block text-white">Historial Médico</strong>
                  <span className="text-slate-500">Bitácora completa</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 relative group perspective-1000">
            {/* HUD Elements */}
            <div className="absolute -left-12 top-10 bg-black/80 backdrop-blur-md border border-teal-500/30 p-3 rounded-lg z-20 hidden md:block animate-float">
              <div className="text-xs text-teal-400 font-mono flex items-center gap-2">
                <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></span>
                ID: #SARR-992
              </div>
              <div className="text-[10px] text-slate-400 mt-1">STATUS: HEALTHY</div>
            </div>

            <div className="absolute right-0 bottom-20 bg-black/80 backdrop-blur-md border border-purple-500/30 p-3 rounded-lg z-20 hidden md:block animate-float delay-1000">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-ping"></div>
                <div className="text-xs text-purple-300 font-mono">CRECIMIENTO</div>
              </div>
              <div className="text-xl font-bold text-white">+2.4 cm</div>
              <div className="w-full bg-purple-900/30 h-1 mt-1 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full w-3/4"></div>
              </div>
            </div>

            {/* Main Card Image */}
            <div className="relative z-10 transform transition-transform duration-700 group-hover:scale-[1.02] group-hover:rotate-1">
              <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/30 to-purple-500/30 rounded-2xl blur-2xl -z-10 opacity-60"></div>
              <img
                src="/demo/Hero.png"
                alt="Ficha Viva"
                className="rounded-2xl border border-white/10 shadow-2xl w-full max-w-md mx-auto object-cover"
              />
              {/* Glossy Overlay */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-black/20 pointer-events-none border border-white/5"></div>
            </div>
          </div>
        </div>
      </section>

      {/* --- GENEALOGY LAB (CRUZAS) --- */}
      <section id="genetics" className="relative z-10 py-24 bg-gradient-to-b from-black/50 to-slate-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-xs font-bold tracking-widest uppercase mb-4">
              Motor De Predicción
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Laboratorio <span className="text-purple-400">Genético</span></h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              El sistema más avanzado para planificar, registrar y visualizar tus proyectos de hibridación.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-4 relative">
            {/* Madre */}
            <div className="flex flex-col items-center group relative z-10">
              <div className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-2 border-purple-500/30 p-1 relative shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                <img src="/demo/madre.png" className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-500" alt="Madre" />
                <div className="absolute inset-0 bg-purple-500/10 group-hover:bg-transparent transition-colors"></div>
              </div>
              <div className="mt-4 text-center">
                <span className="text-xs font-bold text-purple-400 tracking-widest uppercase mb-1 block">Madre</span>
                <h4 className="text-white font-bold bg-slate-900/50 px-3 py-1 rounded-full border border-white/10">Paradox</h4>
              </div>
            </div>

            {/* DNA Connector */}
            <div className="hidden md:flex flex-col items-center justify-center w-32 relative z-0">
              <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gradient-to-r from-purple-500/50 via-white/20 to-teal-500/50 dashed-line"></div>
              <div className="w-12 h-12 bg-slate-900 border border-white/20 rounded-full z-10 flex items-center justify-center animate-spin-slow shadow-lg shadow-purple-500/20">
                <Icon name="science" className="text-white text-xl" />
              </div>
            </div>

            {/* Mobile Connector */}
            <div className="md:hidden text-white/20 rotate-90">
              <Icon name="arrow_forward" className="text-3xl" />
            </div>

            {/* Padre */}
            <div className="flex flex-col items-center group relative z-10">
              <div className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-2 border-teal-500/30 p-1 relative shadow-[0_0_30px_rgba(20,184,166,0.2)]">
                <img src="/demo/padre.png" className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-500" alt="Padre" />
                <div className="absolute inset-0 bg-teal-500/10 group-hover:bg-transparent transition-colors"></div>
              </div>
              <div className="mt-4 text-center">
                <span className="text-xs font-bold text-teal-400 tracking-widest uppercase mb-1 block">Padre</span>
                <h4 className="text-white font-bold bg-slate-900/50 px-3 py-1 rounded-full border border-white/10">Saurus</h4>
              </div>
            </div>

            {/* Result Arrow */}
            <div className="hidden md:flex items-center justify-center w-24">
              <Icon name="arrow_forward" className="text-4xl text-white/10 animate-pulse" />
            </div>
            {/* Mobile Result Arrow */}
            <div className="md:hidden text-white/20 rotate-90">
              <Icon name="arrow_downward" className="text-3xl" />
            </div>

            {/* Hibrido */}
            <div className="flex flex-col items-center relative group z-20">
              <div className="absolute -top-6 bg-gradient-to-r from-purple-600 to-teal-600 text-white text-[10px] font-bold px-4 py-1.5 rounded-full shadow-lg z-20 animate-bounce tracking-widest border border-white/20">
                NUEVO CULTIVAR
              </div>
              <div className="w-40 h-40 md:w-64 md:h-64 rounded-2xl overflow-hidden border border-white/20 shadow-2xl shadow-purple-500/10 relative transform hover:-translate-y-2 transition-transform duration-500">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10"></div>
                <img src="/demo/Hibrido.png" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Híbrido" />

                <div className="absolute bottom-4 left-4 z-20 text-left">
                  <div className="text-xs text-teal-300 mb-1 font-mono">GEN ID: #HYB-2026</div>
                  <h3 className="text-xl font-bold text-white leading-none mb-2">Vein Midnight</h3>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 bg-purple-500/30 border border-purple-500/50 rounded text-[10px] text-purple-100 backdrop-blur-sm">Vigoroso</span>
                    <span className="px-2 py-0.5 bg-teal-500/30 border border-teal-500/50 rounded text-[10px] text-teal-100 backdrop-blur-sm">Color Intenso</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- CREATOR SECTION --- */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-slate-900/80 to-[#050b14]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-12 shadow-2xl relative overflow-hidden">

            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[100px] -z-10" />

            <div className="relative group shrink-0">
              <div className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-white/5 shadow-2xl relative z-10">
                <img src="/creator_mauro.jpg" alt="Mauro - Creador" className="w-full h-full object-cover grayscale-0 transition-all duration-700" />
              </div>
              {/* Organic circle animation */}
              <svg className="absolute inset-0 w-full h-full -m-1 pointer-events-none animate-spin-slow opacity-30 text-teal-500" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="1" fill="none" strokeDasharray="10 5" />
              </svg>
            </div>

            <div className="text-center md:text-left">
              <div className="inline-block px-3 py-1 bg-teal-500/10 border border-teal-500/20 rounded-full text-teal-400 text-xs font-bold tracking-widest uppercase mb-4">
                Fundador
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2 text-white">Hola! Mi nombre es <span className="text-teal-400">Mauro</span></h2>
              <p className="text-teal-500/60 font-mono text-sm tracking-widest uppercase mb-6">Arquitecto de Software & Cultivador</p>

              <div className="space-y-4 text-slate-300 leading-relaxed text-lg italic">
                <p>
                  "CarniLab nació de una frustración personal. Como entusiasta de las plantas carnívoras, me encontraba perdiendo el rastro de mis cruzas genéticas y fechas de riego entre cuadernos viejos y hojas de cálculo desordenadas."
                </p>
                <p>
                  "Decidí fusionar mis dos grandes pasiones: la ingeniería de software y las plantas Carnívoras. ¡Mi objetivo no era solo crear una app, sino diseñar la herramienta definitiva que yo mismo necesitaba!"
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- DIGITAL ECOSYSTEM (GALLERY) --- */}
      <section className="relative z-10 py-20 px-6 bg-[#050b14]/50 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Ecosistema <span className="text-teal-400">Digital</span></h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Más que una base de datos. Una suite completa para el control biológico y comercial.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Dashboard Card */}
            {/* Dashboard Card */}
            <div className="group relative rounded-3xl overflow-hidden border border-white/10 bg-slate-900/50 hover:border-teal-500/30 transition-all duration-500 flex flex-col">
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10 pointer-events-none" />

              {/* Image Container */}
              <div className="w-full flex justify-center items-end gap-2 pt-8 px-4 bg-gradient-to-b from-slate-800/30 to-transparent overflow-hidden">
                <img src="/demo/dashboard_real_1.jpg" alt="Dashboard View 1" className="w-[45%] max-w-[180px] h-auto rounded-t-xl border-t border-x border-white/10 shadow-2xl transform group-hover:translate-y-[-10px] transition-transform duration-700 z-0" />
                <img src="/demo/dashboard_real_2.jpg" alt="Dashboard View 2" className="w-[45%] max-w-[180px] h-auto rounded-t-xl border-t border-x border-white/10 shadow-2xl transform group-hover:translate-y-[-15px] transition-transform duration-700 delay-75 z-0" />
              </div>

              <div className="relative p-8 z-20 mt-auto">
                <div className="w-12 h-12 rounded-xl bg-teal-500/20 backdrop-blur-md flex items-center justify-center mb-4 text-teal-400 border border-teal-500/30">
                  <Icon name="speed" className="text-2xl" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Dashboard</h3>
                <p className="text-slate-400">Monitoreo en tiempo real de humedad, temperatura y fotoperiodo. Alertas automáticas para evitar estrés en tus cultivos.</p>
              </div>
            </div>

            {/* Marketplace Card (Layered Composition) */}
            <div className="group relative rounded-3xl overflow-hidden border border-white/10 bg-slate-900/50 hover:border-purple-500/30 transition-all duration-500 flex flex-col">
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10 pointer-events-none" />

              {/* Layered Image Container */}
              <div className="w-full h-80 relative bg-gradient-to-b from-slate-800/30 to-transparent overflow-hidden">
                {/* Back Layer: Grid */}
                <img
                  src="/demo/vivero_grid.jpg"
                  alt="Colección Global"
                  className="absolute top-8 left-8 w-[60%] h-auto rounded-xl border border-white/10 shadow-2xl opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700 blur-[1px] group-hover:blur-0"
                />

                {/* Front Layer: Detail Card */}
                <img
                  src="/demo/vivero_detail_kleopatra.jpg"
                  alt="Detalle Kleopatra"
                  className="absolute top-4 right-12 w-[45%] max-w-[160px] h-auto rounded-xl border-2 border-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform z-20 group-hover:scale-110 group-hover:-translate-y-2 transition-transform duration-500"
                />
              </div>

              <div className="relative p-8 z-20 mt-auto">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 backdrop-blur-md flex items-center justify-center mb-4 text-purple-400 border border-purple-500/30">
                  <Icon name="storefront" className="text-2xl" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Vivero Global</h3>
                <p className="text-slate-400">Conecta con coleccionistas de élite. Compra genética certificada o vende tus propios clones con trazabilidad garantizada.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- PRICING SECTION --- */}
      <section id="pricing" className="relative z-10 py-20 px-6">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Planes de Investigación</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">Elige la potencia que necesita tu colección.</p>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Plan Básico */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-green-500/30 rounded-2xl p-8 hover:border-green-500/50 transition-all hover:-translate-y-2 duration-300 flex flex-col group">
            <div className="mb-6 text-center">
              <h3 className="text-2xl font-bold text-green-400 mb-1">Básico</h3>
              <p className="text-slate-400 text-sm mb-4 tracking-widest uppercase">Hobby</p>
              <div className="flex items-end justify-center gap-1">
                <span className="text-4xl font-bold text-white">Gratis</span>
              </div>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {[
                { text: 'Hasta 50 Plantas', check: true },
                { text: 'Diario de Cultivo', check: true },
                { text: 'Gestor de Cruzas', check: true },
                { text: 'Alertas de Riego', check: true },
                { text: 'Backup en la Nube', check: true },
                { text: 'Carni Bot (IA)', check: false },
                { text: 'Vivero Online', check: false }
              ].map((feat, i) => (
                <li key={i} className={`flex items-center gap-3 text-sm ${feat.check ? 'text-slate-200' : 'text-slate-600'}`}>
                  <Icon name={feat.check ? 'check_circle' : 'cancel'} className={feat.check ? 'text-green-500' : 'text-slate-700'} />
                  {feat.text}
                </li>
              ))}
            </ul>
            <button onClick={() => navigate('/login?tab=register')} className="w-full py-3 rounded-lg bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 text-green-400 font-bold transition-all">
              Comenzar Gratis
            </button>
          </div>

          {/* Plan PRO */}
          <div className="bg-gradient-to-b from-blue-900/20 to-slate-900/80 backdrop-blur-lg border border-blue-500/50 rounded-2xl p-8 relative hover:-translate-y-2 transition-all duration-300 shadow-2xl flex flex-col ring-1 ring-blue-500/20">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-b-lg tracking-widest uppercase shadow-lg shadow-blue-500/20">
              Recomendado
            </div>
            <div className="mb-6 text-center">
              <h3 className="text-2xl font-bold text-blue-400 mb-1">PRO</h3>
              <p className="text-slate-400 text-sm mb-4 tracking-widest uppercase">Coleccionista</p>
              <div className="flex items-end justify-center gap-1">
                <span className="text-4xl font-bold text-white">$6.000</span>
                <span className="text-slate-500 text-sm mb-1">/mes</span>
              </div>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {[
                { text: 'Plantas ILIMITADAS', check: true, highlight: true },
                { text: 'Carni Bot (IA)', check: true, highlight: true },
                { text: 'Vivero Online (Galería)', check: true },
                { text: 'Monitor de Clima', check: true },
                { text: 'Diario de Cultivo', check: true },
                { text: 'Gestor de Cruzas', check: true }
              ].map((feat, i) => (
                <li key={i} className={`flex items-center gap-3 text-sm ${feat.check ? 'text-white' : 'text-slate-600'}`}>
                  <Icon name="check_circle" className={feat.highlight ? 'text-blue-400' : 'text-slate-400'} />
                  <span className={feat.highlight ? 'font-bold text-blue-100' : ''}>{feat.text}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setPurchaseModal({ show: true, plan: 'pro' })}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold transition-all shadow-lg shadow-blue-500/25"
            >
              Comprar Ahora
            </button>
          </div>

          {/* Plan ELITE */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-purple-500/30 rounded-2xl p-8 hover:border-purple-500/50 transition-all hover:-translate-y-2 duration-300 flex flex-col group">
            <div className="mb-6 text-center">
              <h3 className="text-2xl font-bold text-purple-400 mb-1">ELITE</h3>
              <p className="text-slate-400 text-sm mb-4 tracking-widest uppercase">Negocio</p>
              <div className="flex items-end justify-center gap-1">
                <span className="text-4xl font-bold text-white">$14.000</span>
                <span className="text-slate-500 text-sm mb-1">/mes</span>
              </div>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {[
                { text: 'Todo lo de PRO', check: true },
                { text: 'Modo Venta (Precios)', check: true, highlight: true },
                { text: 'Mensajería Clientes', check: true, highlight: true },
                { text: 'Códigos QR para Macetas', check: true },
                { text: 'Exportar PDF/Excel', check: true },
                { text: 'Genealogía Visual', check: true },
                { text: 'Soporte Prioritario', check: true }
              ].map((feat, i) => (
                <li key={i} className={`flex items-center gap-3 text-sm ${feat.check ? 'text-slate-200' : 'text-slate-600'}`}>
                  <Icon name="check_circle" className={feat.highlight ? 'text-purple-400' : 'text-purple-900/50'} />
                  <span className={feat.highlight ? 'font-bold text-purple-200' : ''}>{feat.text}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setPurchaseModal({ show: true, plan: 'elite' })}
              className="w-full py-3 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 text-purple-300 font-bold transition-all"
            >
              Comprar Ahora
            </button>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="relative z-10 py-12 border-t border-white/5 bg-[#020408]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-slate-500 text-sm gap-4">
          <p>© 2026 CarniLab Research.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-teal-400 transition-colors">Instagram</a>
            <a href="#" className="hover:text-teal-400 transition-colors">Twitter</a>
            <a href="#" className="hover:text-teal-400 transition-colors">GitHub</a>
          </div>
        </div>
      </footer>

      {/* --- MODAL: GENETIC SCANNER --- */}
      {showGeneticsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md animate-fade-in" onClick={() => setShowGeneticsModal(false)} />

          <div className="relative w-full max-w-2xl bg-[#0a111e] border border-teal-500/30 rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(20,184,166,0.2)] animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-900/50">
              <div className="flex items-center gap-2">
                <Icon name="science" className="text-teal-400 animate-pulse" />
                <span className="font-mono text-teal-400 text-sm tracking-widest">SYSTEM_READY // GENETIC_SCANNER</span>
              </div>
              <button onClick={() => setShowGeneticsModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <Icon name="close" />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 relative min-h-[400px] flex flex-col items-center justify-center">
              {/* Scan Line Animation */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="w-full h-[2px] bg-teal-500 shadow-[0_0_20px_#2dd4bf] absolute top-0 animate-scan"></div>
              </div>

              {/* Data Visualization */}
              <div className="grid grid-cols-2 gap-8 w-full">
                <div className="bg-slate-900/50 p-6 rounded-xl border border-white/5 text-center">
                  <div className="w-20 h-20 mx-auto rounded-full bg-purple-500/20 flex items-center justify-center mb-4 border border-purple-500/30">
                    <span className="text-3xl">🧬</span>
                  </div>
                  <h4 className="text-purple-300 font-bold mb-1">Análisis de ADN</h4>
                  <p className="text-slate-500 text-xs">Secuenciando marcadores en cadena...</p>
                </div>
                <div className="bg-slate-900/50 p-6 rounded-xl border border-white/5 text-center">
                  <div className="w-20 h-20 mx-auto rounded-full bg-teal-500/20 flex items-center justify-center mb-4 border border-teal-500/30">
                    <span className="text-3xl">📊</span>
                  </div>
                  <h4 className="text-teal-300 font-bold mb-1">Predicción de Vigor</h4>
                  <p className="text-slate-500 text-xs">Calculando tasa de crecimiento estimada...</p>
                </div>
              </div>

              <div className="mt-8 text-center space-y-2">
                <div className="font-mono text-xs text-slate-500">PROCESANDO MUESTRA: #SARR-992</div>
                <div className="w-full max-w-sm h-1 bg-slate-800 rounded-full mx-auto overflow-hidden">
                  <div className="h-full bg-teal-500 animate-progress-indeterminate"></div>
                </div>
              </div>

              <div className="mt-10">
                <button
                  onClick={() => {
                    setShowGeneticsModal(false);
                    document.getElementById('genetics')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2"
                >
                  Ver Resultados Completos <Icon name="arrow_downward" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* --- MODAL: PURCHASE --- */}
      {purchaseModal.show && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => !isProcessing && setPurchaseModal({ show: false, plan: null })} />
          <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-8 shadow-2xl animate-scale-in">
            <h3 className="text-2xl font-bold text-white mb-2">Activar Plan {purchaseModal.plan?.toUpperCase()}</h3>
            <p className="text-slate-400 text-sm mb-6">Ingresa tu email donde recibirás tu licencia de activación después del pago.</p>

            <form onSubmit={handlePurchase} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Email de Comprador</label>
                <input
                  type="email"
                  required
                  placeholder="ejemplo@email.com"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-teal-500 transition-colors"
                  value={purchaseEmail}
                  onChange={(e) => setPurchaseEmail(e.target.value)}
                  disabled={isProcessing}
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-4 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-xl text-white font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-all flex items-center justify-center gap-2 group shadow-lg shadow-teal-500/20 disabled:opacity-50"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Ir a Pagar <Icon name="payments" className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <button
              onClick={() => setPurchaseModal({ show: false, plan: null })}
              className="w-full mt-4 py-2 text-slate-500 text-xs font-bold hover:text-white transition-colors"
              disabled={isProcessing}
            >
              CANCELAR
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default LandingPage;
