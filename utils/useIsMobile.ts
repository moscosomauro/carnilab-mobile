import { useState, useEffect } from 'react';
import { isElectron } from '../db/syncClient';

// La app de escritorio (Electron) siempre usa la interfaz de escritorio.
// En el navegador/PWA, mostramos la interfaz móvil en pantallas angostas
// (iPhone) — así el navegador ancho sigue mostrando escritorio para testear.
export function computeIsMobile(): boolean {
  if (isElectron()) return false;
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 820;
}

export function useIsMobile(): boolean {
  const [mobile, setMobile] = useState<boolean>(computeIsMobile());
  useEffect(() => {
    const onResize = () => setMobile(computeIsMobile());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return mobile;
}
