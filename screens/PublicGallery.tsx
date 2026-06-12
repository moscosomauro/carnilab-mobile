import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Plant, PlantImage } from '../types';
import { FEATURED_NURSERIES } from '../src/data/mockData';
import { getCountryName, getFlagEmoji } from '../src/data/countryData';
import { ImageCarouselWithThumbnails } from '../components/ImageCarousel';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../components/Icon';

const PublicGallery: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [vivero, setVivero] = useState<{ key: string; label: string; plan: 'basic' | 'pro' | 'elite'; country?: string; specialty?: string; avatar?: string } | null>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [filteredPlants, setFilteredPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [viewMode, setViewMode] = useState<'showroom' | 'cine'>('showroom');

  // Contact Modal State
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [messageForm, setMessageForm] = useState({
    senderName: '',
    senderContact: '',
    message: ''
  });
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  useEffect(() => {
    fetchGalleryData();
  }, [slug]);

  useEffect(() => {
    if (activeCategory === 'Todos') {
      setFilteredPlants(plants);
    } else {
      setFilteredPlants(plants.filter(p => p.especie.toLowerCase().includes(activeCategory.toLowerCase())));
    }
  }, [activeCategory, plants]);

  const fetchGalleryData = async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Check Mock Data First
      const mockNursery = FEATURED_NURSERIES.find(n => n.slug === slug);
      if (mockNursery) {
        setVivero({
          key: mockNursery.id,
          label: mockNursery.name,
          plan: 'elite',
          country: mockNursery.code, // Assuming code maps to country
          specialty: mockNursery.specialty,
          avatar: mockNursery.avatar
        });
        // Convert mock gallery to Plant[] structure
        setPlants(mockNursery.gallery.map(p => ({
          ...p,
          fecha_adquisicion: new Date().toISOString(),
          origen: 'Propio',
          ubicacion: 'Showroom',
          notas: '',
          images: [],
          en_venta: true,
          precio_venta: p.precio
        } as any)));
        setFilteredPlants(mockNursery.gallery.map(p => ({
          ...p,
          fecha_adquisicion: new Date().toISOString(),
          origen: 'Propio',
          ubicacion: 'Showroom',
          notas: '',
          images: [],
          en_venta: true,
          precio_venta: p.precio
        } as any)));
        setLoading(false);
        return;
      }

      const { data, error: rpcError } = await supabase.rpc('get_nursery_by_slug', { target_slug: slug });
      if (rpcError) throw new Error(rpcError.message || 'Error cargando el vivero');
      if (!data || !data.found || !data.plants) throw new Error(data?.error || 'Vivero no encontrado');

      let fetchedPlants = data.plants;
      const plantIds = fetchedPlants.map((p: Plant) => p.id);
      if (plantIds.length > 0) {
        const { data: imagesData, error: imagesError } = await supabase
          .from('plant_images')
          .select('*')
          .in('plant_id', plantIds)
          .order('display_order', { ascending: true });
        if (!imagesError && imagesData) {
          fetchedPlants = fetchedPlants.map((plant: Plant) => ({
            ...plant,
            images: imagesData.filter((img: PlantImage) => img.plant_id === plant.id)
          }));
        }
      }
      setVivero(data.vivero);
      setPlants(fetchedPlants);
      setFilteredPlants(fetchedPlants);
    } catch (err: any) {
      console.error("Gallery Error:", err);
      setError(err.message || 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['Todos', 'Dionaea', 'Nepenthes', 'Sarracenia', 'Drosera'];

  const handleContactClick = (plant: Plant) => {
    setSelectedPlant(plant);
    setMessageForm({ senderName: '', senderContact: '', message: '' });
    setSendSuccess(false);
    setIsModalOpen(true);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vivero || !selectedPlant) return;
    setSending(true);
    try {
      await supabase.from('inbox_messages').insert({
        owner_key: vivero.key,
        sender_name: messageForm.senderName,
        sender_contact: messageForm.senderContact,
        message: messageForm.message,
        plant_id: selectedPlant.id,
        plant_name: selectedPlant.nombre,
        is_read: false
      });
      setSendSuccess(true);
      setTimeout(() => { setIsModalOpen(false); setSendSuccess(false); }, 2000);
    } catch (e) {
      alert("Error al enviar");
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-16 h-16 bg-white/5 rounded-full mb-6 ring-1 ring-white/10"></div>
        <div className="h-1 w-32 bg-white/10 rounded-full"></div>
      </div>
    </div>
  );

  if (error || !vivero) return (
    <div className="min-h-screen flex items-center justify-center text-center p-6 bg-[#0A0D0B] text-white selection:bg-[#D4AF37]/30">
      <div className="animate-in fade-in zoom-in duration-500">
        <h1 className="text-4xl lg:text-6xl font-black mb-4 uppercase italic tracking-tighter opacity-80">Gallery Offline</h1>
        <p className="text-[#8E877F] text-lg font-medium italic">{error || 'El acceso a este vivero ha sido restringido.'}</p>
      </div>
    </div>
  );

  const featuredPlants = filteredPlants.slice(0, 5);
  const catalogPlants = filteredPlants.slice(5);

  return (
    <div className="bg-[#0A0D0B] min-h-screen">
      {/* VIEW TOGGLE FLOATING BUTTON */}
      <button
        onClick={() => setViewMode(prev => prev === 'showroom' ? 'cine' : 'showroom')}
        className="fixed bottom-10 right-10 z-[80] w-20 h-20 bg-white text-black rounded-full shadow-float flex flex-col items-center justify-center border border-gray-100 hover:scale-110 active:scale-95 transition-all group animate-pulse hover:animate-none"
      >
        <Icon 
          name={viewMode === 'showroom' ? 'movie' : 'dashboard'} 
          className="text-2xl group-hover:rotate-12 transition-transform" 
        />
        <span className="text-[8px] font-black uppercase tracking-tighter mt-1">
          {viewMode === 'showroom' ? 'Cine' : 'Showroom'}
        </span>
      </button>

      {/* MOBILE EXPERIENCE (Showroom) */}
      <AnimatePresence mode="wait">
        {viewMode === 'showroom' && (
          <motion.div
            key="mobile"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="lg:hidden"
          >
            <MobileView
              vivero={vivero}
              categories={categories}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              featuredPlants={featuredPlants}
              catalogPlants={catalogPlants}
              filteredPlants={filteredPlants}
              handleContactClick={handleContactClick}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* LUXURY SHOWROOM (PC) */}
      <AnimatePresence mode="wait">
        {viewMode === 'showroom' && (
          <motion.div
            key="desktop"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 0.75 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:block origin-top"
            style={{ width: '133.33%', marginLeft: '-16.66%' }}
          >
            <DesktopShowroom
              vivero={vivero}
              categories={categories}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              featuredPlants={featuredPlants}
              catalogPlants={catalogPlants}
              filteredPlants={filteredPlants}
              handleContactClick={handleContactClick}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* CINE MODE (All Devices) */}
      <AnimatePresence mode="wait">
        {viewMode === 'cine' && (
          <motion.div
            key="cine"
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(5px)' }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <CineView
              vivero={vivero}
              categories={categories}
              plants={plants}
              handleContactClick={handleContactClick}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && selectedPlant && (
          <PlantDetailShowroom
            vivero={vivero}
            selectedPlant={selectedPlant}
            messageForm={messageForm}
            setMessageForm={setMessageForm}
            sending={sending}
            sendSuccess={sendSuccess}
            handleSendMessage={handleSendMessage}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const CineView: React.FC<any> = ({ categories, plants, handleContactClick }) => {
  const billboardPlant = plants.find((p: any) => p.en_venta) || plants[0];
  const realCategories = categories.filter((c: string) => c !== 'Todos');

  return (
    <div className="min-h-screen bg-[#141414] text-white font-display overflow-x-hidden animate-fade-in lg:scale-[0.80] lg:origin-top transition-transform duration-700">
      {/* Billboard Hero */}
      <div className="relative w-full h-[55vh] lg:h-[70vh] overflow-hidden">
        <img
          src={billboardPlant?.images?.[0]?.image_url || billboardPlant?.imagen}
          className="absolute inset-0 w-full h-full object-cover animate-pan scale-110 pointer-events-none"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/60 to-transparent opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />

        <div className="absolute bottom-16 lg:bottom-24 left-6 lg:left-20 max-w-2xl z-10 animate-in slide-in-from-left duration-1000">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-sm tracking-tighter uppercase">N</span>
            <span className="text-white/40 text-[10px] font-bold uppercase tracking-[0.4em]">CarniLab Original</span>
          </div>
          <h1 className="text-5xl lg:text-9xl font-black italic tracking-tighter uppercase leading-[0.9] mb-6 drop-shadow-2xl">
            {billboardPlant?.nombre}
          </h1>
          <p className="text-white/80 text-lg lg:text-xl font-medium mb-8 line-clamp-3 italic shadow-black drop-shadow-md">
            "{billboardPlant?.notas || 'Especimen exclusivo de nuestra colección curada.'}"
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleContactClick(billboardPlant)}
              className="bg-white text-black px-6 lg:px-10 py-3 lg:py-4 rounded-md font-black text-[10px] lg:text-xs uppercase flex items-center gap-2 hover:bg-white/90 transition-all active:scale-95"
            >
              <Icon name="play_arrow" className="text-lg" />
              Ver Detalles
            </button>
            <button className="bg-white/20 backdrop-blur-md text-white px-6 lg:px-10 py-3 lg:py-4 rounded-md font-black text-[10px] lg:text-xs uppercase flex items-center gap-2 hover:bg-white/30 transition-all active:scale-95">
              <Icon name="info" className="text-lg" />
              Más Info
            </button>
          </div>
        </div>
      </div>

      {/* Catalog Rows */}
      <div className="relative z-20 -mt-16 lg:-mt-24 space-y-10 lg:space-y-16 pb-40">
        {realCategories.map((cat: string) => {
          const catPlants = plants.filter((p: any) => p.especie.toLowerCase().includes(cat.toLowerCase()));
          if (catPlants.length === 0) return null;

          return (
            <div key={cat} className="group/row">
              <h2 className="px-6 lg:px-20 text-xl lg:text-3xl font-black mb-6 flex items-center gap-4 text-white/90 drop-shadow-lg">
                {cat}
                <span className="text-teal-400 text-xs font-bold opacity-0 group-hover/row:opacity-100 transition-opacity translate-x-4 group-hover/row:translate-x-0 cursor-pointer">Explorar Todo ›</span>
              </h2>
              <div className="flex gap-4 overflow-x-auto no-scrollbar px-6 lg:px-20 snap-x">
                {catPlants.map((plant: any) => (
                  <div
                    key={plant.id}
                    onClick={() => handleContactClick(plant)}
                    className="min-w-[170px] lg:min-w-[300px] aspect-video rounded-md lg:rounded-lg overflow-hidden relative cursor-pointer group/card transition-all duration-300 hover:scale-110 hover:z-30 snap-start"
                  >
                    <img src={plant.imagen} className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />

                    <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover/card:opacity-100 transition-all translate-y-4 group-hover/card:translate-y-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">{plant.nombre}</span>
                        {plant.en_venta && <span className="bg-red-600 text-[8px] font-bold px-1 rounded-sm uppercase tracking-tighter">Sale</span>}
                      </div>
                      <p className="text-[8px] text-white/60 uppercase tracking-tighter truncate">{plant.especie}</p>
                    </div>

                    {!plant.en_venta && (
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md p-1 rounded-full border border-white/10 opacity-60">
                        <Icon name="lock" className="text-[12px] text-white/40" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <footer className="py-20 bg-[#141414] border-t border-white/5 text-center">
        <div className="flex justify-center gap-8 mb-8 opacity-20 hover:opacity-100 transition-opacity cursor-default grayscale">
          <img src="/carnibot.png" className="w-8 h-8 opacity-50" />
        </div>
        <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.5em]">CarniLab Streaming Service v3.0</p>
      </footer>
    </div>
  );
};

const MobileView: React.FC<any> = ({
  vivero, categories, activeCategory, setActiveCategory,
  featuredPlants, catalogPlants, filteredPlants, handleContactClick
}) => {
  return (
    <div className="min-h-screen bg-[#F9F9F9] text-[#1A231E] font-display pb-20 overflow-x-hidden">
      <div className="px-4 pt-4 pb-4 bg-[#F9F9F9] sticky top-0 z-40 border-b border-gray-100/50 flex justify-center text-center">
        <div className="w-full max-w-4xl bg-[#0A0D0B] rounded-[30px] p-6 shadow-2xl relative overflow-hidden border border-white/5 mx-auto text-left">

          <div className="flex flex-col sm:flex-row gap-6 items-stretch">
            {/* LEFT: AVATAR (mimicking the plant image) */}
            <div className="w-full sm:w-[140px] aspect-square sm:aspect-[3/4] rounded-2xl overflow-hidden relative border border-white/10 shadow-lg bg-[#121512] shrink-0">
              <img src={vivero.avatar || "https://images.unsplash.com/photo-1453906971074-ce568cccbc63?w=400&h=400&fit=crop"} className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 right-2">
                <div className="text-[6px] text-[#D4AF37] tracking-[0.2em] font-black uppercase text-center opacity-80 mix-blend-screen">
                  Official Register
                </div>
              </div>
            </div>

            {/* RIGHT: INFO GRID */}
            <div className="flex-1 flex flex-col justify-center min-w-0">
              <div className="mb-4">
                <span className="text-[#D4AF37] text-[8px] font-black uppercase tracking-[0.3em] block mb-1">Ficha Técnica</span>
                <h1 className="text-3xl font-black text-white leading-[0.9] uppercase italic tracking-tighter mb-1 truncate">
                  {vivero.label}
                </h1>
                <p className="text-white/40 font-bold uppercase tracking-widest text-[9px]">
                  {vivero.specialty || 'Sin especialidad definida'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                <div>
                  <span className="text-[7px] text-[#8E877F] font-black uppercase tracking-[0.2em] block mb-0.5 flex items-center gap-1">
                    <Icon name="fingerprint" className="text-[8px] text-[#D4AF37]" /> Identidad
                  </span>
                  <span className="text-white text-[10px] font-bold block truncate">{vivero.label}</span>
                </div>

                <div>
                  <span className="text-[7px] text-[#8E877F] font-black uppercase tracking-[0.2em] block mb-0.5 flex items-center gap-1">
                    <Icon name="public" className="text-[8px] text-[#D4AF37]" /> Ubicación
                  </span>
                  <span className="text-white text-[10px] font-bold block truncate flex items-center gap-1">
                    {getFlagEmoji(vivero.country || 'AR')} {getCountryName(vivero.country || 'AR')}
                  </span>
                </div>

                <div>
                  <span className="text-[7px] text-[#8E877F] font-black uppercase tracking-[0.2em] block mb-0.5 flex items-center gap-1">
                    <Icon name="folder_open" className="text-[8px] text-[#D4AF37]" /> Ejemplares
                  </span>
                  <span className="text-white text-[10px] font-bold block">{filteredPlants.length} Registrados</span>
                </div>

                <div>
                  <span className="text-[7px] text-[#8E877F] font-black uppercase tracking-[0.2em] block mb-0.5 flex items-center gap-1">
                    <Icon name="verified" className="text-[8px] text-[#D4AF37]" /> Estado
                  </span>
                  <span className={`text-[10px] font-bold block truncate ${vivero.plan === 'elite' ? 'text-[#D4AF37]' : 'text-white'}`}>
                    {vivero.plan === 'elite' ? 'Verificado Elite' : 'Estándar'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Categories Tab Bar */}
        <div className="flex gap-2 overflow-x-auto pb-1 mt-6 no-scrollbar -mx-6 px-6">
          {categories.map((cat: string) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap shadow-sm active:scale-95 ${activeCategory === cat ? 'bg-[#1A231E] text-white' : 'bg-white border border-gray-100 text-[#8E877F]'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {featuredPlants.length > 0 && (
        <div className="mt-6 mb-8">
          <div className="px-6 mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black">Destacados</h2>
          </div>
          <div className="flex overflow-x-auto px-6 gap-5 pb-8 snap-x snap-mandatory no-scrollbar">
            {featuredPlants.map((plant: any) => (
              <div key={plant.id} className="min-w-[85vw] snap-center relative" onClick={() => handleContactClick(plant)}>
                <div className="aspect-[4/5] rounded-[32px] overflow-hidden relative shadow-xl bg-white h-full">
                  <img src={plant.images?.[0]?.image_url || plant.imagen} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                  <div className="absolute bottom-6 left-6 text-white">
                    <h3 className="text-2xl font-black mb-1">{plant.nombre}</h3>
                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">{plant.especie}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-6">
        <h3 className="text-lg font-black mb-4">Explorar Colección</h3>
        <div className="grid grid-cols-2 gap-4 pb-20">
          {(featuredPlants.length > 0 ? catalogPlants : filteredPlants).map((plant: any) => (
            <div key={plant.id} className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 active:scale-95 transition-transform" onClick={() => handleContactClick(plant)}>
              <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 mb-3">
                <img src={plant.imagen || ''} className="w-full h-full object-cover" />
              </div>
              <h4 className="font-bold text-xs truncate mb-1 px-1">{plant.nombre}</h4>
              <p className="text-[9px] text-[#8E877F] uppercase tracking-widest px-1">{plant.especie}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const DesktopShowroom: React.FC<any> = ({
  vivero, categories, activeCategory, setActiveCategory,
  featuredPlants, catalogPlants, filteredPlants, handleContactClick
}) => {
  return (
    <div className="min-h-screen bg-[#0A0D0B] text-white font-display overflow-x-hidden flex flex-col items-center selection:bg-[#D4AF37]/30">
      {/* Cinematic Hero */}
      <div className="relative w-full h-[90vh] overflow-hidden flex flex-col items-center justify-center">
        {featuredPlants[0] && (
          <img
            src={featuredPlants[0].images?.[0]?.image_url || featuredPlants[0].imagen}
            className="absolute inset-0 w-full h-full object-cover opacity-20 animate-pan scale-110 pointer-events-none"
            alt=""
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0A0D0B]/60 to-[#0A0D0B]" />

        <div className="relative z-[40] w-full max-w-6xl px-8 animate-in fade-in zoom-in duration-1000">
          <div className="bg-[#0A0D0B]/80 backdrop-blur-md rounded-[40px] p-10 border border-white/10 shadow-2xl flex items-center gap-12">
            {/* Avatar */}
            <div className="w-64 h-64 rounded-[32px] overflow-hidden border-2 border-[#D4AF37] shadow-[0_0_50px_rgba(212,175,55,0.2)] bg-black shrink-0 relative">
              <img src={vivero.avatar || "https://images.unsplash.com/photo-1453906971074-ce568cccbc63?w=400&h=400&fit=crop"} className="w-full h-full object-cover" />
            </div>

            {/* Info */}
            <div className="flex-1 text-left">
              <span className="text-[#D4AF37] text-xs font-black uppercase tracking-[0.5em] block mb-4">Official Laboratory Register</span>
              <h1 className="text-7xl lg:text-8xl font-black mb-6 leading-[0.85] tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 drop-shadow-2xl">
                {vivero.label}
              </h1>

              <div className="flex flex-wrap gap-x-12 gap-y-6">
                <div>
                  <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] block mb-1">Especialidad</span>
                  <span className="text-white text-xl font-bold uppercase tracking-tight">{vivero.specialty || 'Colección Privada'}</span>
                </div>
                <div>
                  <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] block mb-1">Ubicación</span>
                  <span className="text-white text-xl font-bold uppercase tracking-tight flex items-center gap-2">
                    {getFlagEmoji(vivero.country || 'AR')} {getCountryName(vivero.country || 'AR')}
                  </span>
                </div>
                <div>
                  <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] block mb-1">Colección</span>
                  <span className="text-[#D4AF37] text-xl font-black uppercase tracking-tight">{filteredPlants.length} Especímenes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Bento Grid */}
      <div className="w-full max-w-7xl px-8 -mt-32 lg:-mt-40 relative z-20 mb-48">
        <div className="grid grid-cols-12 gap-8 h-[850px]">
          {featuredPlants[0] && (
            <div className="col-span-12 lg:col-span-8 row-span-2 group relative rounded-[56px] overflow-hidden cursor-pointer shadow-3xl border border-white/5" onClick={() => handleContactClick(featuredPlants[0])}>
              <img src={featuredPlants[0].images?.[0]?.image_url || featuredPlants[0].imagen} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90" />
              <div className="absolute bottom-16 left-16 right-16">
                <span className="text-[#D4AF37] text-xs font-black uppercase tracking-[0.4em] mb-4 block">Especimen de Exhibición</span>
                <h3 className="text-6xl font-black mb-4 uppercase italic tracking-tighter leading-none">{featuredPlants[0].nombre}</h3>
                <p className="text-white/40 italic text-xl max-w-md">{featuredPlants[0].especie}</p>
              </div>
            </div>
          )}

          {featuredPlants.slice(1, 3).map((plant: any) => (
            <div key={plant.id} className="col-span-6 lg:col-span-4 group relative rounded-[48px] overflow-hidden cursor-pointer border border-white/5 shadow-2xl bg-[#121512]" onClick={() => handleContactClick(plant)}>
              <img src={plant.images?.[0]?.image_url || plant.imagen} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-70 group-hover:opacity-100" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
              <div className="absolute bottom-10 left-10">
                <h3 className="text-3xl font-black mb-2 uppercase tracking-tight italic">{plant.nombre}</h3>
                <p className="text-[#D4AF37] text-sm font-black tracking-widest uppercase">${plant.precio_venta || 'Premium'}</p>
              </div>
            </div>
          ))}

          {featuredPlants.slice(3, 5).map((plant: any) => (
            <div key={plant.id} className="col-span-6 lg:col-span-2 group relative rounded-[40px] overflow-hidden cursor-pointer bg-white/5 border border-white/10 flex items-center justify-center p-6 text-center hover:bg-white/10 transition-all" onClick={() => handleContactClick(plant)}>
              <img src={plant.imagen} className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-60 transition-opacity" />
              <h3 className="relative z-10 text-[11px] font-black uppercase tracking-[0.3em] leading-tight">{plant.nombre}</h3>
            </div>
          ))}

          {filteredPlants.length > 5 && (
            <div className="col-span-12 lg:col-span-2 rounded-[40px] border border-white/10 border-dashed flex flex-col items-center justify-center p-8 text-center group cursor-pointer hover:border-[#D4AF37]/50 transition-colors bg-white/[0.02]">
              <span className="text-3xl mb-4 group-hover:scale-125 transition-transform duration-500">🌿</span>
              <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Explorar Catálogo</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Catalog */}
      <div className="w-full max-w-7xl px-8 mb-48">
        <div className="flex items-end justify-between mb-24 border-b border-white/5 pb-12">
          <div>
            <span className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.5em] block mb-4">The Collection</span>
            <h2 className="text-5xl font-black uppercase italic tracking-tighter mb-8">Artículos Disponibles</h2>
            <div className="flex gap-4">
              {categories.map((cat: string) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all transform hover:-translate-y-1 ${activeCategory === cat ? 'bg-white text-black shadow-2xl' : 'bg-white/5 text-white/40 hover:bg-white/10 border border-white/5'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="text-right">
            <span className="text-white/20 text-xs font-bold uppercase tracking-[0.5em] block mb-3">Capacidad Total</span>
            <span className="text-6xl font-black text-white/90 tabular-nums">{filteredPlants.length}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
          {(featuredPlants.length > 0 ? catalogPlants : filteredPlants).map((plant: any) => (
            <div key={plant.id} className="group cursor-pointer" onClick={() => handleContactClick(plant)}>
              <div className="aspect-[4/5] rounded-[56px] overflow-hidden bg-[#121512] mb-10 relative shadow-2xl ring-1 ring-white/5">
                <img src={plant.imagen || ''} className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110 opacity-60 group-hover:opacity-100" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                  <div className="px-8 py-3 bg-[#D4AF37] text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-2xl">
                    Detalles
                  </div>
                </div>
                {plant.precio_venta && (
                  <div className="absolute top-8 right-8 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10">
                    <span className="text-[#D4AF37] font-black text-xs">${plant.precio_venta}</span>
                  </div>
                )}
              </div>
              <div className="px-6">
                <span className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.4em] block mb-3">{plant.especie}</span>
                <h3 className="text-2xl font-black text-white/90 uppercase italic tracking-tighter leading-tight group-hover:text-white transition-colors">{plant.nombre}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className="w-full py-40 bg-white/[0.02] border-t border-white/5 flex flex-col items-center">
        <h2 className="text-4xl font-black uppercase italic tracking-[0.4em] mb-16 opacity-90">{vivero.label}</h2>
        <div className="flex flex-wrap justify-center gap-12 lg:gap-24 text-white/20 font-black text-[10px] uppercase tracking-[0.6em]">
          <span>Scientific Boutique</span>
          <span className="hidden sm:inline">•</span>
          <span>© 2025 CarniLab</span>
          <span className="hidden sm:inline">•</span>
          <span>Premium Edition</span>
        </div>
      </footer>
    </div>
  );
};

// Helper to calculate age
const calculatePlantAge = (acquisitionDate: string) => {
  if (!acquisitionDate) return "N/D";
  const start = new Date(acquisitionDate);
  const now = new Date();
  const diffMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());

  if (diffMonths < 1) return "Recién adquirida";
  if (diffMonths < 12) return `${diffMonths} meses`;
  const years = Math.floor(diffMonths / 12);
  const remainingMonths = diffMonths % 12;
  return remainingMonths > 0 ? `${years} año${years > 1 ? 's' : ''} y ${remainingMonths} m` : `${years} año${years > 1 ? 's' : ''}`;
};

const PlantDetailShowroom: React.FC<any> = ({
  vivero, selectedPlant, messageForm, setMessageForm,
  sending, sendSuccess, handleSendMessage, onClose
}) => {
  const [showContactForm, setShowContactForm] = useState(false);

  // ✅ PREPARAR IMÁGENES PARA EL CARRUSEL
  const images = selectedPlant.images?.length > 0
    ? selectedPlant.images.map((img: any) => img.image_url)
    : [selectedPlant.imagen];

  const specs = [
    { label: 'Identidad', value: selectedPlant.nombre, icon: 'fingerprint' },
    { label: 'Especie', value: selectedPlant.especie, icon: 'Psychology' },
    { label: 'Adquisición', value: calculatePlantAge(selectedPlant.fecha_adquisicion), icon: 'calendar_today' },
    { label: 'Riego', value: selectedPlant.notas?.toLowerCase().includes('riego') ? 'Especializado' : 'Bandeja/Destilada', icon: 'water_drop' },
    { label: 'Origen', value: selectedPlant.origen || 'Cultivo Propio', icon: 'location_on' },
    { label: 'Estado', value: selectedPlant.estado || 'Saludable', icon: 'verified' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/98 backdrop-blur-3xl p-0 sm:p-4 lg:p-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-[#0A0D0B] w-full max-w-7xl h-full sm:h-[90vh] sm:rounded-[60px] overflow-hidden relative border border-white/5 flex flex-col lg:flex-row shadow-[0_100px_200px_-50px_rgba(0,0,0,1)]"
        onClick={e => e.stopPropagation()}
      >

        {/* Close Button Mobile */}
        <button onClick={onClose} className="absolute top-6 right-6 z-50 w-12 h-12 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-white lg:hidden">✕</button>

        {/* Left: Immersive Gallery con Carrusel */}
        <div className="w-full lg:w-[60%] h-[50vh] lg:h-full relative group bg-black">
          {/* ✅ CARRUSEL CON THUMBNAILS */}
          <ImageCarouselWithThumbnails
            images={images}
            alt={selectedPlant.nombre}
            className="h-full"
          />

          {/* Overlay gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D0B] via-transparent to-black/20 pointer-events-none z-10" />

          <div className="absolute top-12 left-12 hidden lg:block z-20 pointer-events-none">
            <span className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.5em] block mb-2">Technical Registry</span>
            <span className="text-white/40 text-[10px] font-medium uppercase tracking-[0.2em]">CarniLab Collection v2.0</span>
          </div>
        </div>

        {/* Right: Technical Sheet & Content */}
        <div className="w-full lg:w-[40%] h-full flex flex-col p-8 lg:p-16 overflow-y-auto no-scrollbar bg-gradient-to-b from-[#0A0D0B] to-[#121512]">

          <div className="mb-12">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[#D4AF37] text-[11px] font-black uppercase tracking-[0.5em] block mb-4">Ficha Técnica</span>
                <h2 className="text-5xl lg:text-6xl font-black text-white uppercase italic tracking-tighter leading-none mb-2">{selectedPlant.nombre}</h2>
                <p className="text-white/40 text-xl italic">{selectedPlant.especie}</p>
              </div>
              <button onClick={onClose} className="hidden lg:flex w-14 h-14 bg-white/5 border border-white/10 rounded-full items-center justify-center text-white hover:bg-[#D4AF37] transition-all transform hover:rotate-90">✕</button>
            </div>

            {selectedPlant.precio_venta && (
              <div className="inline-flex items-center gap-3 bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-6 py-2 rounded-full mb-8">
                <span className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse" />
                <span className="text-[#D4AF37] font-black text-sm uppercase tracking-widest">Disponible para Adquisición - ${selectedPlant.precio_venta}</span>
              </div>
            )}
          </div>

          {!showContactForm ? (
            <div className="space-y-12 animate-in slide-in-from-bottom duration-700">
              {/* Spec Grid */}
              <div className="grid grid-cols-2 gap-y-10 gap-x-8">
                {specs.map((spec, idx) => (
                  <div key={idx} className="group">
                    <div className="flex items-center gap-3 mb-2">
                      <Icon name={spec.icon} className="text-[18px] text-[#D4AF37] opacity-60 group-hover:opacity-100 transition-opacity" />
                      <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{spec.label}</span>
                    </div>
                    <span className="text-lg font-bold text-white/90 group-hover:text-[#D4AF37] transition-colors">{spec.value}</span>
                  </div>
                ))}
              </div>

              {selectedPlant.notas && (
                <div className="p-8 bg-white/[0.03] border border-white/5 rounded-[40px] italic">
                  <p className="text-[#8E877F] leading-relaxed text-sm">"{selectedPlant.notas}"</p>
                </div>
              )}

              <div className="pt-8 flex flex-col gap-4">
                {selectedPlant.en_venta && vivero.plan === 'elite' ? (
                  <button
                    onClick={() => setShowContactForm(true)}
                    className="w-full py-6 bg-[#D4AF37] text-white rounded-full font-black uppercase tracking-[0.4em] text-[11px] shadow-2xl hover:bg-white hover:text-black transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
                  >
                    <Icon name="send" className="text-lg" />
                    Consultar Disponibilidad
                  </button>
                ) : (
                  <div className="w-full py-6 bg-white/[0.05] border border-white/10 text-white/20 rounded-full font-black uppercase tracking-[0.4em] text-[11px] flex items-center justify-center gap-3 cursor-not-allowed">
                    <Icon name="lock" className="text-lg opacity-40" />
                    No Disponible para Venta
                  </div>
                )}
                <button
                  onClick={onClose}
                  className="w-full py-6 border border-white/10 text-white/40 rounded-full font-black uppercase tracking-[0.4em] text-[11px] hover:text-white transition-all active:scale-95"
                >
                  Regresar al Showroom
                </button>
              </div>
            </div>
          ) : (
            <div className="animate-in slide-in-from-right duration-700">
              <div className="mb-12 flex items-center gap-4">
                <button onClick={() => setShowContactForm(false)} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-all">←</button>
                <h3 className="text-2xl font-black uppercase italic tracking-tight">Iniciar Consulta</h3>
              </div>

              {sendSuccess ? (
                <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-[48px] p-16 text-center animate-zoom-in">
                  <span className="text-5xl block mb-6 animate-bounce">✨</span>
                  <h4 className="text-[#D4AF37] font-black uppercase tracking-[0.5em] text-sm mb-4">Mensaje Enviado</h4>
                  <p className="text-white/40 text-xs italic">El cultivador responderá pronto.</p>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-2">Su Nombre</label>
                    <input type="text" placeholder="EJ: JUAN PÉREZ" required className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none focus:border-[#D4AF37] transition-all" value={messageForm.senderName} onChange={e => setMessageForm({ ...messageForm, senderName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-2">Contacto (WA / Email)</label>
                    <input type="text" placeholder="+54 9..." required className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none focus:border-[#D4AF37] transition-all" value={messageForm.senderContact} onChange={e => setMessageForm({ ...messageForm, senderContact: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-2">Mensaje Especial</label>
                    <textarea rows={3} placeholder="MÁS INFO SOBRE ESTE ESPECIMEN..." required className="w-full bg-white/[0.03] border border-white/10 rounded-3xl px-6 py-4 text-sm font-medium text-white outline-none focus:border-[#D4AF37] transition-all resize-none italic" value={messageForm.message} onChange={e => setMessageForm({ ...messageForm, message: e.target.value })} />
                  </div>
                  <button type="submit" disabled={sending} className="w-full py-6 bg-white text-black rounded-full font-black uppercase tracking-[0.4em] text-[11px] hover:bg-[#D4AF37] hover:text-white transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50">
                    {sending ? 'ENVIANDO...' : 'ENVIAR CONSULTA'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PublicGallery;
