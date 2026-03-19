import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { AssetIcon } from '../components/AssetIcon';
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import worldData from "../src/data/world-110m.json";
import { geoRobinson } from "d3-geo-projection";
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

import { ISO_NUMERIC_TO_ALPHA2, getFlagEmoji, getCountryName } from '../src/data/countryData';

// ... existing imports


// ... existing imports

const WorldMap = ({ onRegionClick, selectedRegion }: { onRegionClick: (code: string) => void, selectedRegion: string }) => {
    return (
        <div className="relative w-full aspect-[16/9] bg-[#FDFCF9] rounded-[60px] border-[6px] border-white shadow-[0_25px_60px_rgba(0,0,0,0.1)] overflow-hidden group">
            {/* High-fidelity Botanical Background Texture */}
            <div className="absolute inset-0 opacity-[0.08] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#6B8E23]/5 via-transparent to-[#F2CA78]/5 pointer-events-none" />

            <div className="w-full h-full p-4 relative z-10">
                <ComposableMap projection={geoRobinson()} className="w-full h-full">
                    <defs>
                        {/* Organic Filter for edges */}
                        <filter id="organic-edge">
                            <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" result="noise" />
                            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1" />
                        </filter>

                        {/* Lush Leaf Gradients */}
                        <linearGradient id="grad-leaf" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#7DA041" />
                            <stop offset="100%" stopColor="#4A5D23" />
                        </linearGradient>

                        <linearGradient id="grad-leaf-active" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#97BC53" />
                            <stop offset="100%" stopColor="#2D4C1E" />
                        </linearGradient>

                        {/* Pattern for leaf texture */}
                        <pattern id="leaf-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M10 2 Q14 10 10 18 Q6 10 10 2" fill="white" opacity="0.1" />
                        </pattern>
                    </defs>

                    <Geographies geography={worldData}>
                        {({ geographies }) =>
                            geographies.map((geo) => {
                                const regionCode = ISO_NUMERIC_TO_ALPHA2[geo.id]; // Map numeric to Alpha-2
                                const isActive = !!regionCode;
                                const isSelected = regionCode === selectedRegion;

                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        fill={isSelected ? "url(#grad-leaf-active)" : (isActive ? "#D8E2D1" : "#E6EBE4")}
                                        stroke="#FFFFFF"
                                        strokeWidth={0.5}
                                        style={{
                                            default: { outline: "none", transition: "all 0.5s" },
                                            hover: { fill: isActive ? "url(#grad-leaf-active)" : "#E6EBE4", outline: "none", filter: "brightness(1.1)" },
                                            pressed: { outline: "none" },
                                        }}
                                        onClick={() => isActive && onRegionClick(regionCode)}
                                        className={isActive ? "cursor-pointer" : "pointer-events-none"}
                                        filter="url(#organic-edge)"
                                    />
                                );
                            })
                        }
                    </Geographies>

                    {/* Active Markers */}
                    {[
                        { coordinates: [-64, -34], id: 'AR' }, // Argentina
                        { coordinates: [-55, -10], id: 'BR' }, // Brazil
                        { coordinates: [-4, 40], id: 'ES' },   // Spain
                        { coordinates: [-100, 40], id: 'US' }, // USA
                        { coordinates: [-102, 23], id: 'MX' }, // Mexico
                    ].map(({ coordinates, id }) => (
                        <Marker key={id} coordinates={coordinates as [number, number]}>
                            <g className="animate-in fade-in zoom-in duration-1000">
                                <circle r={8} fill="#6B8E23" opacity="0.3" className="animate-pulse" />
                                <circle r={3} fill="#6B8E23" stroke="white" strokeWidth={1} />
                            </g>
                        </Marker>
                    ))}
                </ComposableMap>
            </div>

            {/* Legend Overlay - More Scientific/Botanical */}
            <div className="absolute inset-x-0 bottom-8 px-10 flex justify-between items-end pointer-events-none">
                <div className="bg-white/90 backdrop-blur-xl px-6 py-3 rounded-[28px] border border-white/60 shadow-xl flex items-center gap-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#6B8E23] animate-pulse" />
                    <div>
                        <span className="text-[10px] font-black text-[#4A5D23] uppercase tracking-[0.3em] block leading-none mb-1">Red Global</span>
                        <p className="text-[9px] text-[#8E877F] font-bold italic">Topografía Standard (Robinson)</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DiscoveryPrototype: React.FC = () => {
    const navigate = useNavigate();
    const { user, updateUserSlug } = useAuth();
    const [selectedCountry, setSelectedCountry] = useState('AR');
    const [viewMode, setViewMode] = useState<'global' | 'region'>('global');
    const [nurseries, setNurseries] = useState<any[]>([]); // Start empty, fetch real only
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [newNursery, setNewNursery] = useState({ country: '', specialty: '', nurseryName: '', avatarUrl: '' });

    // Derived active countries from nurseries data
    const activeCountries = React.useMemo(() => {
        const codes = Array.from(new Set(nurseries.map(n => n.code)));
        return codes.map(code => ({
            code,
            name: getCountryName(code),
            flag: getFlagEmoji(code),
            nurseries: nurseries.filter(n => n.code === code).length,
            bg: '#F5F1EB'
        }));
    }, [nurseries]);

    const currentCountryData = activeCountries.find(c => c.code === selectedCountry) || {
        code: selectedCountry,
        name: getCountryName(selectedCountry),
        flag: getFlagEmoji(selectedCountry),
        nurseries: 0,
        bg: '#F5F1EB'
    };

    // Fetch nurseries from Supabase
    React.useEffect(() => {
        const fetchNurseries = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('is_nursery_public', true);

            if (data && data.length > 0) {
                const mappedNurseries = data.map(p => ({
                    id: p.id,
                    name: p.nursery_name || p.last_name || "Laboratorio", // Prefer nursery_name
                    owner: p.first_name ? `${p.first_name} ${p.last_name || ''}` : "Cultivador",
                    country: getCountryName(p.country_code),
                    code: p.country_code,
                    flag: getFlagEmoji(p.country_code),
                    specialty: p.specialty || "General",
                    slug: (p.slug || p.id).toString(), // Fallback to ID and force string
                    image: p.avatar || "https://images.unsplash.com/photo-1453906971074-ce568cccbc63?w=400&h=400&fit=crop",
                    followers: "New",
                    plants: 0,
                    verified: p.is_verified,
                    accent: "#6B8E23"
                }));
                // Set only real data
                setNurseries(mappedNurseries);
            }
        };
        fetchNurseries();
    }, []);

    const handleRegister = async () => {
        if (!user) return;
        setLoading(true);
        const slug = newNursery.nurseryName
            ? newNursery.nurseryName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + user.uid.slice(0, 4)
            : `user-${user.uid.slice(0, 8)}`;

        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.uid,
                    country_code: newNursery.country,
                    specialty: newNursery.specialty,
                    nursery_name: newNursery.nurseryName,
                    slug: slug,
                    avatar: newNursery.avatarUrl, // CORRECTED COLUMN NAME
                    is_nursery_public: true,
                    updated_at: new Date()
                });

            if (error) throw error;

            // SYNC ACCESS KEYS (Critical for Dashboard Link & Avatar)
            await supabase.from('access_keys').update({
                slug: slug,
                label: newNursery.nurseryName || user.label,
                avatar_url: newNursery.avatarUrl
            }).eq('device_id', user.uid);

            // We call the context method to ensure LOCAL state is also updated
            await updateUserSlug(slug);
            // Ideally updateUserAvatar should also be called or we just refresh, but slug update is key for navigation.

            setShowRegisterModal(false);
            alert("¡Bienvenido a la Red Global!");
            // Refresh logic optional
        } catch (e) {
            console.error("Error registering:", e);
            alert("Hubo un error al registrarse.");
        } finally {
            setLoading(false);
        }
    };

    const handleContact = async (nurseryId: string) => {
        if (!user) {
            alert("Debes iniciar sesión para contactar.");
            return;
        }

        if (nurseryId === user.uid) {
            alert("No puedes enviarte mensajes a ti mismo.");
            return;
        }

        setLoading(true);
        try {
            // Check if conversation exists
            const { data: existing } = await supabase
                .from('conversations')
                .select('id')
                .or(`and(participant_a.eq.${user.uid},participant_b.eq.${nurseryId}),and(participant_a.eq.${nurseryId},participant_b.eq.${user.uid})`)
                .maybeSingle();

            if (existing) {
                navigate(`/chat/${existing.id}`);
            } else {
                // Create new
                const { data: newConv, error } = await supabase
                    .from('conversations')
                    .insert({
                        participant_a: user.uid,
                        participant_b: nurseryId,
                        last_updated: new Date()
                    })
                    .select()
                    .single();

                if (error) throw error;
                if (newConv) navigate(`/chat/${newConv.id}`);
            }
        } catch (e) {
            console.error("Error starting chat:", e);
            alert("Error al conectar.");
        } finally {
            setLoading(false);
        }
    };

    const handleCountrySelect = (code: string) => {
        setSelectedCountry(code);
        setViewMode('region');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const filteredNurseries = nurseries.filter(n => n.code === selectedCountry);

    return (
        <div className="min-h-screen bg-[#F5F1EB] text-[#2E2E2E] font-sans pb-32">
            {viewMode === 'global' ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="bg-white px-8 pt-16 pb-10 shadow-lg shadow-black/5 relative overflow-hidden" style={{ borderRadius: "0 0 60px 28px" }}>
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="animate-in slide-in-from-left duration-700 delay-300">
                                <h1 className="text-4xl font-black text-[#2E2E2E] tracking-tighter leading-none mb-2 italic">Red Global</h1>
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#6B8E23] animate-pulse shadow-[0_0_12px_#6B8E23]" />
                                    <span className="text-[10px] font-black text-[#8E877F] uppercase tracking-[0.25em]">Exploración Activa</span>
                                </div>
                            </div>
                            <div className="w-16 h-16 rounded-3xl bg-[#F5F1EB] flex items-center justify-center border border-white shadow-xl rotate-3">
                                <AssetIcon name="icon-vivero" size={38} />
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#6B8E23]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    </div>

                    <div className="px-6 -mt-8 relative z-20">
                        <div className="bg-white/80 backdrop-blur-2xl rounded-full shadow-2xl border border-white p-2.5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-[#F5F1EB] flex items-center justify-center text-[#6B8E23] shadow-inner">
                                <Icon name="search" className="text-xl" />
                            </div>
                            <input type="text" placeholder="Buscar genética o laboratorios..." className="flex-1 bg-transparent text-sm font-bold placeholder:text-[#CFC8C0] outline-none" />
                        </div>
                    </div>

                    <section className="mt-10 px-6">
                        <WorldMap onRegionClick={handleCountrySelect} selectedRegion={selectedCountry} />
                    </section>

                    <section className="mt-10 px-6 pb-10">
                        <div className="flex items-center justify-between mb-6 px-4">
                            <h2 className="text-[11px] font-black text-[#8E877F] uppercase tracking-[0.3em]">Territorios Conectados</h2>
                        </div>
                        <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide px-2">
                            <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide px-2">
                                {activeCountries.map((c) => (
                                    <button key={c.code} onClick={() => handleCountrySelect(c.code)} className={`flex flex-col items-center min-w-[110px] p-6 rounded-[45px] shadow-xl border-4 transition-all duration-500 ${selectedCountry === c.code ? 'border-[#6B8E23] scale-110 -translate-y-2' : 'border-white opacity-70 grayscale-[0.5]'}`} style={{ background: c.bg }}>
                                        <div className="w-16 h-16 rounded-full bg-white/40 flex items-center justify-center text-4xl mb-3 shadow-inner border border-white/20">{c.flag}</div>
                                        <span className="text-xs font-black text-[#2E2E2E] mb-1 tracking-tight">{c.name}</span>
                                        <div className="bg-black/10 px-2.5 py-1 rounded-full border border-black/5"><span className="text-[9px] font-bold text-[#2E2E2E] opacity-70">{c.nurseries} Labs</span></div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                    <div className="bg-white px-8 pt-16 pb-12 shadow-2xl relative overflow-hidden" style={{ borderRadius: "0 0 70px 35px" }}>
                        <div className="flex justify-between items-center mb-10">
                            <button onClick={() => setViewMode('global')} className="flex items-center gap-3 text-[#8E877F] font-black text-[10px] uppercase tracking-[0.25em] active:scale-90 transition-transform bg-[#F5F1EB] px-4 py-2.5 rounded-full border border-gray-100">
                                <Icon name="arrow_back" className="text-lg" />
                                <span>Volver</span>
                            </button>
                            <button onClick={() => {
                                const existing = nurseries.find(n => n.id === user?.uid);
                                if (existing) {
                                    setNewNursery({
                                        country: existing.code,
                                        specialty: existing.specialty,
                                        nurseryName: existing.name,
                                        avatarUrl: existing.image // Map image to avatarUrl
                                    });
                                }
                                setShowRegisterModal(true);
                            }} className={`flex items-center gap-2 text-white font-black text-[10px] uppercase tracking-[0.25em] active:scale-90 transition-transform px-5 py-2.5 rounded-full shadow-lg ${nurseries.some(n => n.id === user?.uid) ? 'bg-[#4A5D4F] shadow-[#4A5D4F]/20' : 'bg-[#6B8E23] shadow-[#6B8E23]/20'}`}>
                                <span className="text-lg">{nurseries.some(n => n.id === user?.uid) ? '⚙️' : '📍'}</span>
                                <span>{nurseries.some(n => n.id === user?.uid) ? 'Gestionar' : 'Sumarme'}</span>
                            </button>
                        </div>
                        <div className="flex items-center gap-8 px-2">
                            <div className="w-24 h-24 rounded-[45px] shadow-2xl flex items-center justify-center text-6xl border-[6px] border-white -rotate-6 transition-transform hover:rotate-0 duration-500" style={{ background: currentCountryData?.bg }}>{currentCountryData?.flag}</div>
                            <div className="flex-1">
                                <h1 className="text-4xl font-black text-[#2E2E2E] tracking-tighter leading-none mb-2">{currentCountryData?.name}</h1>
                                <div className="flex items-center gap-3">
                                    <div className="bg-[#6B8E23] px-4 py-1.5 rounded-full shadow-lg shadow-[#6B8E23]/20">
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">{currentCountryData?.nurseries} Laboratorios</span>
                                    </div>
                                    <div className="w-2 h-2 rounded-full bg-[#6B8E23] animate-pulse" />
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-10">
                            {[
                                { v: filteredNurseries.reduce((acc, n) => acc + (n.plants || 0), 0), l: "Plantas", bg: "#DCE9DA" },
                                { v: filteredNurseries.length, l: "Laboratorios", bg: "#F0DBC7" },
                                { v: "#--", l: "Ranking", bg: "#E4D4B8" }
                            ].map((s, i) => (
                                <div key={i} className="p-5 rounded-[32px] text-center border-4 border-white shadow-xl" style={{ background: s.bg }}>
                                    <span className="block text-2xl font-black text-[#2E2E2E] mb-1">{s.v}</span>
                                    <span className="text-[9px] font-black text-[#8E877F] uppercase tracking-widest">{s.l}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="px-6 py-10">
                        <div className="flex items-center justify-between mb-8 px-4">
                            <h2 className="text-[11px] font-black text-[#8E877F] uppercase tracking-[0.2em]">Cultivadores en {currentCountryData?.name}</h2>
                        </div>
                        <div className="space-y-6">
                            {filteredNurseries.length > 0 ? filteredNurseries.map((n) => (
                                <div key={n.id} className="bg-white/80 backdrop-blur-xl p-6 border-4 border-white shadow-2xl relative overflow-hidden group hover:scale-[1.02] transition-all duration-500" style={{ borderRadius: "50px 20px 50px 20px" }}>
                                    <div className="flex gap-6 relative z-10">
                                        <div className="relative">
                                            <div className="w-28 h-28 rounded-[40px] overflow-hidden border-4 border-white shadow-2xl bg-[#F5F1EB]">
                                                <img src={n.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={n.name} />
                                            </div>
                                            {n.verified && <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#6B8E23] rounded-full flex items-center justify-center border-[4px] border-white shadow-xl"><span className="text-lg text-white">🌿</span></div>}
                                        </div>
                                        <div className="flex-1 flex flex-col justify-center">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="text-2xl font-black text-[#2E2E2E] leading-none tracking-tight">{n.name}</h3>
                                                    <p className="text-[10px] font-bold text-[#8E877F] uppercase tracking-wider mt-1">Por {n.owner}</p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-[#6B8E23]" />
                                                        <span className="text-[10px] uppercase font-bold text-[#8E877F] tracking-widest">{n.specialty}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 mt-4">
                                                <button
                                                    onClick={() => navigate(`/vivero/${n.slug}`)}
                                                    className="px-5 py-4 bg-[#F5F1EB] rounded-2xl border-2 border-[#E8E1D5] text-[10px] font-black uppercase tracking-widest text-[#4A5D4F] hover:bg-white transition-colors"
                                                >
                                                    Visitar
                                                </button>

                                                <button
                                                    onClick={() => handleContact(n.id.toString())}
                                                    className="flex-1 py-4 px-6 text-white font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-2xl active:scale-95 hover:brightness-110" style={{ background: n.accent, borderRadius: "25px", boxShadow: `0 12px 30px ${n.accent}40` }}
                                                >
                                                    Contactar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="py-24 text-center bg-white/40 rounded-[60px] border-4 border-dashed border-white/60">
                                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl border-4 border-white"><Icon name="psychology_alt" className="text-5xl text-[#CFC8C0] opacity-40" /></div>
                                    <p className="text-[#8E877F] font-black text-sm uppercase tracking-widest px-10">Nadie ha mapeado este territorio aún</p>
                                    <button onClick={() => setShowRegisterModal(true)} className="mt-6 bg-[#6B8E23] text-white px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl shadow-[#6B8E23]/20 transition-all hover:scale-105 active:scale-95">Inaugurar mi Laboratorio</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showRegisterModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-[40px] p-8 w-full max-w-sm shadow-2xl relative overflow-hidden animate-in zoom-in duration-300">
                        <h2 className="text-2xl font-black text-[#2E2E2E] mb-2 leading-none">Únete al Mapa</h2>
                        <p className="text-xs text-[#8E877F] font-bold mb-6">Haz visible tu laboratorio al mundo.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-[#8E877F] uppercase tracking-widest mb-2">Nombre de tu Laboratorio</label>
                                <input
                                    type="text"
                                    value={newNursery.nurseryName}
                                    onChange={(e) => setNewNursery({ ...newNursery, nurseryName: e.target.value })}
                                    className="w-full bg-[#F5F1EB] rounded-2xl px-4 py-3 text-sm font-bold text-[#2E2E2E] outline-none border-2 border-transparent focus:border-[#6B8E23] placeholder:text-gray-300"
                                    placeholder="Ej. CarniLab Studio"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-[#8E877F] uppercase tracking-widest mb-2">Tu Territorio</label>
                                <div className="relative">
                                    <select
                                        value={newNursery.country}
                                        onChange={(e) => setNewNursery({ ...newNursery, country: e.target.value })}
                                        className="w-full bg-[#F5F1EB] rounded-2xl px-4 py-3 text-sm font-bold text-[#2E2E2E] outline-none border-2 border-transparent focus:border-[#6B8E23] appearance-none"
                                    >
                                        <option value="">Selecciona tu país...</option>
                                        {Array.from(new Set(Object.values(ISO_NUMERIC_TO_ALPHA2))).sort().map(code => (
                                            <option key={code} value={code}>
                                                {getFlagEmoji(code)} {getCountryName(code)}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#8E877F]">
                                        ▼
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-[#8E877F] uppercase tracking-widest mb-2">Especialidad</label>
                                <input
                                    type="text"
                                    value={newNursery.specialty}
                                    onChange={(e) => setNewNursery({ ...newNursery, specialty: e.target.value })}
                                    placeholder="Ej: Sarracenias, Nepenthes..."
                                    className="w-full bg-[#F5F1EB] rounded-xl px-4 py-3 text-sm font-bold text-[#2E2E2E] outline-none border-2 border-transparent focus:border-[#6B8E23]"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-[#8E877F] uppercase tracking-widest mb-2">Foto de Perfil</label>
                                <div className="flex items-center gap-4">
                                    <div className="relative group w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center shrink-0">
                                        {newNursery.avatarUrl ? (
                                            <img src={newNursery.avatarUrl} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-2xl text-gray-300">📷</span>
                                        )}
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[9px] font-bold text-white uppercase">Cambiar</span>
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={async (e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    const file = e.target.files[0];
                                                    setLoading(true);
                                                    try {
                                                        const fileExt = file.name.split('.').pop();
                                                        const fileName = `${user?.uid}-${Math.random()}.${fileExt}`;
                                                        const filePath = `avatars/${fileName}`;

                                                        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
                                                        if (uploadError) throw uploadError;

                                                        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
                                                        setNewNursery(prev => ({ ...prev, avatarUrl: data.publicUrl }));
                                                    } catch (error) {
                                                        console.error("Upload Error:", error);
                                                        alert("Error subiendo imagen");
                                                    } finally {
                                                        setLoading(false);
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] text-[#2E2E2E] font-bold leading-tight mb-1">Sube una imagen</p>
                                        <p className="text-[8px] text-[#8E877F]">Máx 2MB. JPG o PNG.</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleRegister}
                                disabled={loading}
                                className={`w-full text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all mt-4 disabled:opacity-50 ${nurseries.some(n => n.id === user?.uid) ? 'bg-[#4A5D4F]' : 'bg-[#6B8E23]'}`}
                            >
                                {loading ? 'Guardando...' : (nurseries.some(n => n.id === user?.uid) ? 'Actualizar Datos' : 'Confirmar Alta')}
                            </button>
                            <button onClick={() => setShowRegisterModal(false)} className="w-full py-3 text-[#8E877F] font-bold text-xs">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}


            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-white/40 px-10 py-5 flex justify-between z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
                {[
                    { l: "Home", ic: <AssetIcon name="icon-home" size={24} />, act: false, path: "/dashboard" },
                    { l: "Mapa", ic: <AssetIcon name="icon-vivero" size={24} />, act: true, path: "/discovery" },
                    { l: "Mensajes", ic: <AssetIcon name="icon-mensajes" size={24} />, act: false, path: "/inbox" },
                    { l: "Perfil", ic: <AssetIcon name="icon-profile" size={24} />, act: false, path: "/profile" },
                ].map((t, i) => (
                    <div key={i} onClick={() => { if (t.path === '/discovery' && viewMode === 'region') { setViewMode('global'); } else { navigate(t.path); } }} className={`flex flex-col items-center gap-1.5 cursor-pointer active:scale-90 transition-transform ${t.act ? "text-[#6B8E23]" : "text-[#CFC8C0]"}`}>
                        <div className={`flex items-center justify-center scale-110 transition-all ${t.act ? "drop-shadow-[0_0_8px_rgba(107,142,35,0.4)]" : "grayscale opacity-50"}`}>{t.ic}</div>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em]">{t.l}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DiscoveryPrototype;
