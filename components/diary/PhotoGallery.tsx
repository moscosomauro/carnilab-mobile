/**
 * Galería de Fotos Horizontal con Carrusel
 * Muestra la evolución visual de la planta
 */

import React, { useRef, useState } from 'react';

interface PhotoGalleryProps {
  photos: string[];
  plantName: string;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({ photos, plantName }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  if (photos.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 mb-4 shadow-sm border border-white dark:border-slate-700 text-center">
        <div className="text-[40px] mb-2 opacity-20">📷</div>
        <p className="text-[12px] text-[#8E877F] dark:text-slate-400 font-medium">Sin fotos registradas</p>
      </div>
    );
  }

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 mb-4 shadow-sm border border-white dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[12px] font-black text-[#8E877F] dark:text-slate-400 uppercase tracking-wider">
            📸 Galería de Evolución ({photos.length})
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => scroll('left')}
              className="w-8 h-8 rounded-full bg-[#F5F1EB] dark:bg-slate-700 flex items-center justify-center text-[#4A5D4F] dark:text-slate-300 hover:bg-[#EFEBE4] dark:hover:bg-slate-600 active:scale-90 transition-all"
            >
              ←
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-8 h-8 rounded-full bg-[#F5F1EB] dark:bg-slate-700 flex items-center justify-center text-[#4A5D4F] dark:text-slate-300 hover:bg-[#EFEBE4] dark:hover:bg-slate-600 active:scale-90 transition-all"
            >
              →
            </button>
          </div>
        </div>

        {/* Carrusel Horizontal */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth pb-2"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {photos.map((photo, index) => (
            <div
              key={index}
              onClick={() => setSelectedPhoto(photo)}
              className="flex-shrink-0 w-32 h-32 rounded-xl overflow-hidden cursor-pointer hover:scale-105 transition-transform shadow-md border-2 border-white dark:border-slate-700 hover:border-[#4A5D4F] dark:hover:border-[#6B8E23]"
              style={{ scrollSnapAlign: 'start' }}
            >
              <img
                src={photo}
                alt={`${plantName} - Foto ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>

        {/* Comparativa Primera vs Última */}
        {photos.length > 1 && (
          <div className="mt-4 pt-4 border-t border-[#F5F1EB] dark:border-slate-700">
            <h4 className="text-[10px] font-black text-[#8E877F] dark:text-slate-400 uppercase tracking-wider mb-2">
              Comparativa de Crecimiento
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[9px] font-bold text-[#8E877F] dark:text-slate-400 mb-1">Día 1</div>
                <div
                  onClick={() => setSelectedPhoto(photos[0])}
                  className="rounded-xl overflow-hidden cursor-pointer hover:scale-105 transition-transform shadow-sm border border-[#E5E5E5] dark:border-slate-600"
                >
                  <img
                    src={photos[0]}
                    alt="Primera foto"
                    className="w-full h-24 object-cover"
                  />
                </div>
              </div>
              <div>
                <div className="text-[9px] font-bold text-[#8E877F] dark:text-slate-400 mb-1">Actual</div>
                <div
                  onClick={() => setSelectedPhoto(photos[photos.length - 1])}
                  className="rounded-xl overflow-hidden cursor-pointer hover:scale-105 transition-transform shadow-sm border border-[#E5E5E5] dark:border-slate-600"
                >
                  <img
                    src={photos[photos.length - 1]}
                    alt="Última foto"
                    className="w-full h-24 object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Foto Ampliada */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-12 right-0 w-10 h-10 bg-white dark:bg-slate-800 dark:text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            >
              ✕
            </button>
            <img
              src={selectedPhoto}
              alt="Foto ampliada"
              className="w-full h-auto max-h-[80vh] object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default PhotoGallery;
