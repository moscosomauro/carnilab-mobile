/**
 * Timeline Ascendente de Entradas del Diario
 * Muestra la cronología desde el día 1 hasta el presente
 */

import React, { useState } from 'react';
import { DiaryEntry } from '../../types';
import { calculateRelativeDay } from '../../utils/diaryHelpers';
import ImageLightbox from '../ImageLightbox';

interface TimelineAscendingProps {
  entries: DiaryEntry[];
  firstEntryDate: string;
  onEdit: (entry: DiaryEntry) => void;
  onDelete: (id: number) => void;
}

const typeConfig: Record<string, { label: string; color: string; icon: string }> = {
  riego: { label: 'Riego', color: '#3B82F6', icon: '💧' },
  fertilizacion: { label: 'Fertilización', color: '#10B981', icon: '🌱' },
  poda: { label: 'Poda', color: '#F97316', icon: '✂️' },
  observacion: { label: 'Observación', color: '#8B5CF6', icon: '👁️' },
};

const TimelineAscending: React.FC<TimelineAscendingProps> = ({
  entries,
  firstEntryDate,
  onEdit,
  onDelete,
}) => {
  // Lightbox state
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (images: string[], startIndex: number = 0) => {
    setLightboxImages(images);
    setLightboxIndex(startIndex);
  };

  const closeLightbox = () => {
    setLightboxImages([]);
    setLightboxIndex(0);
  };

  // Ordenar ascendente (más viejo primero)
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );

  if (sortedEntries.length === 0) {
    return (
      <div className="text-center py-8 text-[#8E877F]">
        <p className="text-[14px] font-medium">No hay entradas registradas</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <h3 className="text-[12px] font-black text-[#8E877F] dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span>📖</span> Bitácora Cronológica
      </h3>

      {/* Timeline con línea vertical */}
      <div className="relative border-l-2 border-[#E5E7EB] dark:border-slate-700 ml-6 space-y-6">
        {sortedEntries.map((entry) => {
          const relativeDay = calculateRelativeDay(entry.fecha, firstEntryDate);
          const config = typeConfig[entry.tipo] || typeConfig.observacion;

          return (
            <div key={entry.id} className="relative pl-8 pb-4">
              {/* Node en la línea */}
              <div
                className="absolute -left-[17px] top-0 w-8 h-8 rounded-full border-4 border-[#F5F1EB] dark:border-slate-900 flex items-center justify-center text-[14px] shadow-md z-10"
                style={{ backgroundColor: config.color }}
              >
                {config.icon}
              </div>

              {/* Día Relativo Badge */}
              <div className="absolute -left-[17px] -top-6 bg-[#4A5D4F] dark:bg-slate-700 text-white px-2 py-0.5 rounded-full text-[9px] font-black shadow-sm">
                Día {relativeDay}
              </div>

              {/* Card de Entrada */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-white dark:border-slate-700 hover:shadow-md transition-shadow group">
                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase"
                        style={{
                          backgroundColor: config.color + '20',
                          color: config.color,
                        }}
                      >
                        {config.label}
                      </span>
                      <span className="text-[10px] text-[#8E877F] dark:text-slate-400 font-medium">
                        {new Date(entry.fecha).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Descripción */}
                <p className="text-[13px] font-medium text-[#4A5D4F] dark:text-slate-300 leading-relaxed mb-2">
                  {entry.descripcion}
                </p>

                {/* Métricas */}
                {(entry.altura || entry.hojas) && (
                  <div className="flex gap-2 mb-2">
                    {entry.altura && (
                      <span className="bg-[#EFEBE4] dark:bg-slate-700 text-[#4A5D4F] dark:text-slate-300 px-2 py-1 rounded-full text-[10px] font-bold border border-[#E5E5E5] dark:border-slate-600">
                        📏 {entry.altura}cm
                      </span>
                    )}
                    {entry.hojas && (
                      <span className="bg-[#EFEBE4] dark:bg-slate-700 text-[#4A5D4F] dark:text-slate-300 px-2 py-1 rounded-full text-[10px] font-bold border border-[#E5E5E5] dark:border-slate-600">
                        🍃 {entry.hojas} hojas
                      </span>
                    )}
                  </div>
                )}

                {/* Galería de imágenes - Click para lightbox */}
                {(entry.imagenes?.length || entry.imagen) && (() => {
                  const allImages = entry.imagenes?.length ? entry.imagenes : (entry.imagen ? [entry.imagen] : []);
                  return (
                    <div className="rounded-xl overflow-hidden mb-2 shadow-sm">
                      {allImages.length > 1 ? (
                        <div className="flex gap-1 overflow-x-auto pb-1 snap-x">
                          {allImages.map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`Entrada ${idx + 1}`}
                              className="h-40 w-auto object-cover rounded-lg snap-start flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => openLightbox(allImages, idx)}
                            />
                          ))}
                        </div>
                      ) : (
                        <img
                          src={allImages[0]}
                          alt="Entrada"
                          className="w-full h-40 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => openLightbox(allImages, 0)}
                        />
                      )}
                    </div>
                  );
                })()}

                {/* Acciones */}
                <div className="flex justify-end gap-3 pt-2 border-t border-[#F5F1EB] dark:border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEdit(entry)}
                    className="text-[10px] font-black text-[#4A5D4F] dark:text-slate-400 hover:bg-[#F0FDF4] dark:hover:bg-slate-700 px-2 py-1 rounded transition-colors"
                  >
                    EDITAR
                  </button>
                  <button
                    onClick={() => onDelete(entry.id)}
                    className="text-[10px] font-black text-[#FF7A59] hover:bg-[#FEF2F2] dark:hover:bg-slate-700 px-2 py-1 rounded transition-colors"
                  >
                    BORRAR
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Marcador Final */}
        <div className="relative pl-8">
          <div className="absolute -left-[13px] top-0 w-6 h-6 rounded-full bg-[#4A5D4F] dark:bg-slate-700 border-4 border-[#F5F1EB] dark:border-slate-900 shadow-md z-10" />
          <div className="text-[11px] font-bold text-[#8E877F] dark:text-slate-400 italic">
            {sortedEntries.length} {sortedEntries.length === 1 ? 'entrada registrada' : 'entradas registradas'}
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      {lightboxImages.length > 0 && (
        <ImageLightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={closeLightbox}
        />
      )}
    </div>
  );
};

export default TimelineAscending;
