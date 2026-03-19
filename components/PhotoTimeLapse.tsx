import React, { useState, useEffect, useCallback, useMemo } from 'react';

interface PhotoFrame {
  url: string;
  date: string;
  dayNumber: number;
}

interface PhotoTimeLapseProps {
  photos: PhotoFrame[];
  plantName: string;
  onClose: () => void;
}

const IconPlay = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5,3 19,12 5,21" />
  </svg>
);

const IconPause = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
);

const IconPrev = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15,18 9,12 15,6" />
  </svg>
);

const IconNext = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9,18 15,12 9,6" />
  </svg>
);

const PhotoTimeLapse: React.FC<PhotoTimeLapseProps> = ({ photos, plantName, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const speedMs = useMemo(() => {
    switch (speed) {
      case 'slow': return 2000;
      case 'normal': return 1000;
      case 'fast': return 500;
    }
  }, [speed]);

  const goNext = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setIsTransitioning(false);
      }, 150);
    } else {
      // Loop back to start
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(0);
        setIsTransitioning(false);
      }, 150);
    }
  }, [currentIndex, photos.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(prev => prev - 1);
        setIsTransitioning(false);
      }, 150);
    }
  }, [currentIndex]);

  // Auto-play effect
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      goNext();
    }, speedMs);

    return () => clearInterval(interval);
  }, [isPlaying, speedMs, goNext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [onClose, goNext, goPrev]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const currentPhoto = photos[currentIndex];
  const progress = ((currentIndex + 1) / photos.length) * 100;

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/95 flex flex-col"
      onClick={handleBackdropClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white text-xl font-bold transition-colors"
          >
            ✕
          </button>
          <div>
            <h2 className="text-white font-bold text-lg">{plantName}</h2>
            <p className="text-white/60 text-xs">Time-Lapse de Crecimiento</p>
          </div>
        </div>
        <div className="bg-black/50 text-white px-3 py-1.5 rounded-full text-sm font-bold">
          {currentIndex + 1} / {photos.length}
        </div>
      </div>

      {/* Main Photo Area */}
      <div className="flex-1 flex items-center justify-center p-4 relative">
        {/* Navigation Buttons */}
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all ${currentIndex === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
        >
          <IconPrev />
        </button>

        <button
          onClick={goNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
        >
          <IconNext />
        </button>

        {/* Photo with transition */}
        <div className="relative max-w-full max-h-full">
          <img
            src={currentPhoto.url}
            alt={`Foto ${currentIndex + 1}`}
            className={`max-w-full max-h-[60vh] object-contain rounded-2xl shadow-2xl transition-all duration-150 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
          />

          {/* Date overlay on photo */}
          <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-xl">
            <p className="text-white font-bold text-sm">
              {new Date(currentPhoto.date).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </p>
            <p className="text-white/70 text-xs">
              Dia {currentPhoto.dayNumber}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-4 mb-2">
        <div className="h-1 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Timeline dots */}
      <div className="px-4 mb-4 overflow-x-auto">
        <div className="flex gap-1 justify-center min-w-max py-2">
          {photos.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setIsTransitioning(true);
                setTimeout(() => {
                  setCurrentIndex(idx);
                  setIsTransitioning(false);
                }, 150);
              }}
              className={`h-2 rounded-full transition-all ${
                idx === currentIndex
                  ? 'w-6 bg-green-400'
                  : idx < currentIndex
                    ? 'w-2 bg-green-400/50'
                    : 'w-2 bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 pb-6 pt-2 bg-gradient-to-t from-black/60 to-transparent">
        <div className="flex items-center justify-center gap-6">
          {/* Speed selector */}
          <div className="flex bg-white/10 rounded-full p-1">
            {(['slow', 'normal', 'fast'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  speed === s
                    ? 'bg-white text-black'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                {s === 'slow' ? 'Lenta' : s === 'normal' ? 'Normal' : 'Rapida'}
              </button>
            ))}
          </div>

          {/* Play/Pause button */}
          <button
            onClick={() => setIsPlaying(prev => !prev)}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${
              isPlaying
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isPlaying ? <IconPause /> : <IconPlay />}
          </button>

          {/* Spacer for symmetry */}
          <div className="w-[120px]" />
        </div>

        {/* Hint */}
        <p className="text-center text-white/40 text-xs mt-4">
          Usa las flechas o desliza para navegar. Espacio para play/pause.
        </p>
      </div>
    </div>
  );
};

export default PhotoTimeLapse;
