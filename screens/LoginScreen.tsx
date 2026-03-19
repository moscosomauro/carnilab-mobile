import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '../supabaseClient';
import { Mail, Lock, User, Key, ArrowRight, ShieldCheck } from 'lucide-react'; // Using Lucide icons for consistency

const LoginScreen: React.FC = () => {
  // ... (rest of code) ...
  // ... (rest of code) ...
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, resetPassword, user, isLoadingAuth, authError, recoveryMode } = useAuth();
  const { currentLogo } = useTheme();

  // Tabs: 'login' | 'register' | 'recovery' | 'update_password'
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'recovery' | 'update_password'>('login');


  // Mode: User vs Admin
  const [isAdminLogin, setIsAdminLogin] = useState(false);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [licenseKey, setLicenseKey] = useState('');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRescueBtn, setShowRescueBtn] = useState(false);
  const [recoveryTokens, setRecoveryTokens] = useState<{ access_token: string, refresh_token: string } | null>(null);

  // 1. Temporizador de rescate
  useEffect(() => {
    if (isLoadingAuth) {
      const timer = setTimeout(() => setShowRescueBtn(true), 5000);
      return () => clearTimeout(timer);
    } else {
      setShowRescueBtn(false);
    }
  }, [isLoadingAuth]);

  // 2. Detectar errores en la URL y MODO RECUPERACIÓN
  useEffect(() => {
    // --- PERSISTENCIA DE TOKENS ---
    const hashParams = new URLSearchParams(location.hash.replace('#', '?'));
    const searchParams = new URLSearchParams(location.search);
    const getAuthParam = (key: string) => hashParams.get(key) || searchParams.get(key);

    const tAcc = getAuthParam('access_token');
    const tRef = getAuthParam('refresh_token');

    if (tAcc && tRef) {
      const tokens = { access_token: tAcc, refresh_token: tRef };
      setRecoveryTokens(tokens);
      localStorage.setItem('carnilab_recovery_tokens', JSON.stringify(tokens));
    } else {
      const stored = localStorage.getItem('carnilab_recovery_tokens');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.access_token && parsed.refresh_token) {
            setRecoveryTokens(parsed);
          }
        } catch (e) { console.error(e); }
      }
    }

    if (recoveryMode) {
      setActiveTab('update_password');
      setSuccessMsg('✅ Modo Recuperación activado. Crea tu nueva contraseña.');
      return;
    }

    const handleHashCheck = async () => {
      const hashParams = new URLSearchParams(location.hash.replace('#', '?'));
      const searchParams = new URLSearchParams(location.search);
      const getParam = (key: string) => hashParams.get(key) || searchParams.get(key);

      if (location.hash.includes('type=recovery') || location.search.includes('type=recovery') || getParam('type') === 'recovery') {
        setActiveTab('update_password');
        setSuccessMsg('✅ Modo Recuperación detectado via Link.');
      }

      const tabParam = getParam('tab');
      if (tabParam === 'register' && !recoveryMode && !location.hash.includes('type=recovery')) {
        setActiveTab('register');
      }

      const errorCode = getParam('error_code');
      const errorDesc = getParam('error_description');
      const paymentStatus = getParam('payment');
      const paymentId = getParam('id');
      const plan = getParam('plan');

      if (paymentStatus === 'success' && paymentId) {
        setActiveTab('register');
        setSuccessMsg(`✅ ¡Pago Exitoso! Tu licencia de plan ${plan?.toUpperCase()} está siendo activada.`);

        // Función para buscar la licencia
        const fetchLicense = async () => {
          setLoading(true);
          try {
            // Intentamos hasta 5 veces con delay de 2s
            for (let i = 0; i < 5; i++) {
              const { data, error } = await supabase.functions.invoke('get-license-by-payment', {
                body: { payment_id: paymentId }
              });

              if (!error && data?.success) {
                setLicenseKey(data.key);
                setSuccessMsg(`✅ ¡Licencia Encontrada! Usa esta clave para registrarte:`);
                break;
              }
              await new Promise(r => setTimeout(r, 2000));
            }
          } catch (e) {
            console.error("Error buscando licencia:", e);
          } finally {
            setLoading(false);
          }
        };

        fetchLicense();
      } else if (paymentStatus === 'failure') {
        setError('❌ El pago no se pudo procesar. Intenta nuevamente.');
      }

      if (errorCode === 'otp_expired') {
        setError('El enlace ha caducado. Solicita uno nuevo.');
        setActiveTab('recovery');
      } else if (errorDesc) {
        setError(decodeURIComponent(errorDesc).replace(/\+/g, ' '));
      }
    };
    handleHashCheck();
  }, [location, recoveryMode]);

  // 3. Redirección Inteligente
  useEffect(() => {
    const isRecoveryHash = location.hash && location.hash.includes('type=recovery');
    if (activeTab === 'update_password' || isRecoveryHash || recoveryMode) return;

    if (user?.isAuthenticated) {
      if (user.isAdmin) navigate('/admin');
      else navigate('/dashboard');
    }
  }, [user, navigate, activeTab, location, recoveryMode]);

  const toggleAdminMode = () => {
    setIsAdminLogin(!isAdminLogin);
    setError('');
    setPassword('');
    if (!isAdminLogin) {
      setEmail('ADMIN');
      setActiveTab('login');
    } else {
      setEmail('');
    }
  };

  const handleForceReload = () => window.location.reload();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      // --- RECUPERACIÓN ---
      if (activeTab === 'recovery') {
        if (!email.trim()) throw new Error('Ingresa tu correo electrónico.');
        const res = await resetPassword(email);
        if (res.success) {
          setSuccessMsg('✅ Correo enviado. Revisa tu bandeja.');
          setEmail('');
        } else throw new Error(res.message);
        setLoading(false);
        return;
      }

      // --- ACTUALIZAR PASSWORD ---
      if (activeTab === 'update_password') {
        if (!password || !confirmPassword) throw new Error('Ingresa y confirma tu contraseña.');
        if (password.length < 6) throw new Error('Mínimo 6 caracteres.');
        if (password !== confirmPassword) throw new Error('Las contraseñas no coinciden.');

        const performUpdate = async () => {
          const raceTimeout = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms));
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              const { error } = await supabase.auth.updateUser({ password: password });
              if (error) throw error;
              return true;
            }
          } catch (e) { }

          if (recoveryTokens) {
            try {
              await Promise.race([
                supabase.auth.setSession({ access_token: recoveryTokens.access_token, refresh_token: recoveryTokens.refresh_token }),
                raceTimeout(3000)
              ]);
              const { error: updateError } = await supabase.auth.updateUser({ password: password });
              if (!updateError) return true;
            } catch (e) { }

            // Nuclear Option
            const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${recoveryTokens.access_token}`,
                'apikey': SUPABASE_ANON_KEY
              },
              body: JSON.stringify({ password: password })
            });

            if (!res.ok) {
              const errData = await res.json();
              throw new Error(errData.msg || "Error al actualizar contraseña");
            }
            return true;
          }
          throw new Error("No hay tokens válidos.");
        };

        await performUpdate();
        setSuccessMsg('✅ Contraseña actualizada.');
        setTimeout(() => navigate('/dashboard'), 1500);
        setLoading(false);
        return;
      }

      // --- LOGIN ---
      if (activeTab === 'login' || isAdminLogin) {
        const result = await signIn(email, password);
        if (!result.success) {
          setError(result.message.includes("Invalid login") ? "Credenciales incorrectas" : result.message);
        }
      }
      // --- REGISTRO ---
      else {
        if (!name || !email || !password) throw new Error('Completa los campos nombre, email y contraseña.');
        const result = await signUp(email, password, name, licenseKey);
        if (result.success) {
          setActiveTab('login');
          alert(`✅ Cuenta creada. Revisa tu correo.`);
          setLoading(false);
          return;
        } else {
          setError(result.message);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error desconocido.');
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-[#f7f9f6] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-500/5 via-[#f7f9f6] to-[#f7f9f6]" />
        <div className="w-16 h-16 border-4 border-teal-500/10 border-t-teal-500 rounded-full animate-spin mb-4 relative z-10" />
        {showRescueBtn && (
          <button onClick={handleForceReload} className="px-6 py-2 bg-red-500/5 text-red-500 text-xs rounded-full border border-red-500/10 hover:bg-red-500/10 z-10 transition-colors">
            Forzar Recarga
          </button>
        )}
      </div>
    );
  }

  // --- STYLES ---
  const glassPanel = "bg-white border border-slate-100 shadow-[0_20px_40px_-5px_rgba(0,0,0,0.05)]";
  const inputStyle = "w-full bg-slate-50 border border-slate-200 rounded-xl px-10 py-4 text-slate-800 placeholder-slate-400 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-sm font-medium";

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#f7f9f6]`}>

      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-teal-500/5 blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-500/5 blur-[120px] animate-pulse pointer-events-none" />

      {/* Main Card */}
      <div className={`w-full max-w-[400px] rounded-[32px] p-8 md:p-10 relative z-10 ${glassPanel} flex flex-col items-stretch`}>

        {/* Header Icon */}
        <div className="flex justify-center mb-6">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg transform transition-all hover:scale-105 hover:rotate-3
                ${isAdminLogin ? 'bg-gradient-to-br from-orange-500 to-red-600 shadow-orange-500/20' : 'bg-gradient-to-br from-teal-500 to-emerald-600 shadow-teal-500/20'}
            `}>
            {isAdminLogin ? <ShieldCheck className="text-white w-10 h-10" /> : <img src={currentLogo} alt="Logo" className="w-12 h-12 object-contain" />}
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">
            {activeTab === 'update_password' ? 'Nueva Contraseña' :
              (isAdminLogin ? 'Admin Portal' :
                (activeTab === 'recovery' ? 'Recuperar Cuenta' :
                  (activeTab === 'register' ? 'Crear Cuenta' : 'Bienvenido')))}
          </h1>
          <p className="text-slate-400 text-xs font-medium px-4">
            {isAdminLogin ? 'Acceso restringido a personal autorizado' :
              (activeTab === 'register' ? 'Únete a CarniLab hoy mismo' : 'Ingresa tus credenciales para continuar')}
          </p>
        </div>

        {/* Tabs Switcher */}
        {!isAdminLogin && activeTab !== 'recovery' && activeTab !== 'update_password' && (
          <div className="flex bg-slate-50 p-1 rounded-xl mb-8 relative">
            <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-all duration-300 ${activeTab === 'login' ? 'left-1' : 'left-[calc(50%+2px)]'}`} />
            <button onClick={() => setActiveTab('login')} className={`flex-1 py-2.5 text-xs font-bold relative z-10 transition-colors ${activeTab === 'login' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>Ingresar</button>
            <button onClick={() => setActiveTab('register')} className={`flex-1 py-2.5 text-xs font-bold relative z-10 transition-colors ${activeTab === 'register' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>Registrarse</button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ERROR / SUCCESS MESSAGES */}
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-red-600 text-xs font-bold text-center animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-emerald-600 text-xs font-bold text-center animate-in fade-in slide-in-from-top-2">
              {successMsg}
            </div>
          )}
          {authError && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-red-600 text-xs font-bold text-center animate-in fade-in slide-in-from-top-2">
              {authError}
            </div>
          )}

          {/* REGISTER FIELDS */}
          {activeTab === 'register' && !isAdminLogin && (
            <div className="relative group">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-teal-500 transition-colors" />
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nombre Completo" className={inputStyle} />
            </div>
          )}

          {/* EMAIL FIELD */}
          {activeTab !== 'update_password' && !isAdminLogin && (
            <div className="relative group">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-teal-500 transition-colors" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Correo Electrónico" className={inputStyle} />
            </div>
          )}

          {/* ADMIN EMAIL (Fake) */}
          {isAdminLogin && (
            <div className="relative group opacity-50 pointer-events-none">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input type="text" value="ADMINISTRATOR" readOnly className={`${inputStyle} bg-slate-100 text-slate-500`} />
            </div>
          )}

          {/* PASSWORD FIELD */}
          {(activeTab === 'login' || activeTab === 'register' || isAdminLogin || activeTab === 'update_password') && (
            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-teal-500 transition-colors" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={activeTab === 'update_password' ? "Nueva contraseña" : "Contraseña"}
                className={inputStyle}
              />
            </div>
          )}

          {/* CONFIRM PASSWORD */}
          {activeTab === 'update_password' && (
            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-teal-500 transition-colors" />
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirmar contraseña"
                className={inputStyle}
              />
            </div>
          )}

          {/* LICENSE KEY */}
          {activeTab === 'register' && !isAdminLogin && (
            <div className="relative group">
              <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-teal-500 transition-colors" />
              <input type="text" value={licenseKey} onChange={e => setLicenseKey(e.target.value)} placeholder="Licencia (Opcional)" className={inputStyle} />
            </div>
          )}

          {/* FORGOT PASS LINK */}
          {activeTab === 'login' && !isAdminLogin && (
            <div className="flex justify-end pt-1">
              <button type="button" onClick={() => setActiveTab('recovery')} className="text-[10px] font-bold text-slate-400 hover:text-teal-600 transition-colors">
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}

          {/* ACTION BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 group transition-all hover:scale-[1.02] mt-4
                    ${isAdminLogin ? 'bg-gradient-to-r from-orange-500 to-red-600 shadow-orange-500/20' : 'bg-[#27ae60] shadow-teal-500/20'}
                `}
          >
            <span>
              {loading ? 'Procesando...' : (activeTab === 'update_password' ? 'Guardar Cambios' : (activeTab === 'recovery' ? 'Enviar Código' : (activeTab === 'register' ? 'Crear Cuenta' : 'Ingresar')))}
            </span>
            {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
          </button>

          {(activeTab === 'recovery' || activeTab === 'update_password') && (
            <button type="button" onClick={() => setActiveTab('login')} className="w-full text-center py-2 text-slate-400 text-xs font-bold hover:text-slate-600 transition-colors">
              Cancelar
            </button>
          )}

        </form>

        {/* ADMIN TOGGLE */}
        {activeTab !== 'recovery' && activeTab !== 'update_password' && (
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <button onClick={toggleAdminMode} className="text-[10px] font-bold text-slate-300 hover:text-slate-500 uppercase tracking-widest transition-colors">
              {isAdminLogin ? 'Volver a Usuario' : 'Acceso Administrativo'}
            </button>
          </div>
        )}

      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-6 text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] pointer-events-none">
        CarniLab Systems v3.0
      </div>

    </div>
  );
};

export default LoginScreen;
