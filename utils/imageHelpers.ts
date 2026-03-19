import { supabase } from '../supabaseClient';

// Simple UUID generator to avoid external dependencies issues
const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Helper para delay entre operaciones
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================
// NUEVA FUNCIÓN: Comprimir imagen directamente a Blob (más eficiente)
// ============================================
export const compressImageToBlob = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();

        const cleanup = () => {
            URL.revokeObjectURL(objectUrl);
            img.onload = null;
            img.onerror = null;
        };

        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                // 800px es buen balance entre calidad y tamaño
                const MAX_SIZE = 800;
                let width = img.width;
                let height = img.height;

                // Escalar proporcionalmente
                if (width > height && width > MAX_SIZE) {
                    height = Math.round(height * (MAX_SIZE / width));
                    width = MAX_SIZE;
                } else if (height > MAX_SIZE) {
                    width = Math.round(width * (MAX_SIZE / height));
                    height = MAX_SIZE;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    cleanup();
                    reject(new Error("Could not get canvas context"));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                // Usar toBlob directamente (más eficiente que toDataURL)
                canvas.toBlob(
                    (blob) => {
                        // Limpiar canvas
                        canvas.width = 0;
                        canvas.height = 0;
                        cleanup();

                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error("No se pudo crear el blob"));
                        }
                    },
                    'image/jpeg',
                    0.7 // Calidad 0.7 = buen balance
                );
            } catch (e) {
                cleanup();
                reject(e);
            }
        };

        img.onerror = () => {
            cleanup();
            reject(new Error(`No se pudo cargar la imagen: ${file.name}`));
        };

        img.src = objectUrl;
    });
};

// Función legacy para preview (mantener compatibilidad)
export const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();

        const cleanup = () => {
            URL.revokeObjectURL(objectUrl);
            img.onload = null;
            img.onerror = null;
        };

        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const MAX_SIZE = 800;
                let width = img.width;
                let height = img.height;

                if (width > height && width > MAX_SIZE) {
                    height = Math.round(height * (MAX_SIZE / width));
                    width = MAX_SIZE;
                } else if (height > MAX_SIZE) {
                    width = Math.round(width * (MAX_SIZE / height));
                    height = MAX_SIZE;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    cleanup();
                    reject(new Error("Could not get canvas context"));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);
                const result = canvas.toDataURL('image/jpeg', 0.7);

                canvas.width = 0;
                canvas.height = 0;
                cleanup();
                resolve(result);
            } catch (e) {
                cleanup();
                reject(e);
            }
        };

        img.onerror = () => {
            cleanup();
            reject(new Error(`No se pudo cargar la imagen: ${file.name}`));
        };

        img.src = objectUrl;
    });
};

// Cola de imágenes pendientes para sincronizar offline
const PENDING_IMAGES_KEY = 'carnilab_pending_images';

interface PendingImage {
    id: string;
    base64: string;
    userId: string;
    timestamp: number;
}

// Guardar imagen pendiente para sync posterior
const savePendingImage = (base64: string, userId: string): string => {
    try {
        const pending = JSON.parse(localStorage.getItem(PENDING_IMAGES_KEY) || '[]') as PendingImage[];
        const id = `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        pending.push({ id, base64, userId, timestamp: Date.now() });
        localStorage.setItem(PENDING_IMAGES_KEY, JSON.stringify(pending));
        console.log('[uploadImage] Imagen guardada offline:', id);
        return base64;
    } catch (e) {
        console.error('[savePendingImage] Error guardando offline:', e);
        return base64;
    }
};

// Obtener imágenes pendientes
export const getPendingImages = (): PendingImage[] => {
    try {
        return JSON.parse(localStorage.getItem(PENDING_IMAGES_KEY) || '[]');
    } catch {
        return [];
    }
};

// Contar imágenes pendientes
export const getPendingImagesCount = (): number => {
    return getPendingImages().length;
};

// Verificar si una URL es una imagen pendiente (base64)
export const isOfflineImage = (url: string): boolean => {
    return url?.startsWith('data:image') || false;
};

// Sincronizar imágenes pendientes
export const syncPendingImages = async (): Promise<number> => {
    const pending = getPendingImages();
    if (pending.length === 0) return 0;

    console.log('[syncPendingImages] Sincronizando', pending.length, 'imágenes pendientes...');
    let synced = 0;

    for (const img of pending) {
        try {
            const res = await fetch(img.base64);
            const blob = await res.blob();
            const fileName = `${img.userId}/${generateId()}.jpg`;

            const { error } = await supabase.storage
                .from('plant-images')
                .upload(fileName, blob, { contentType: 'image/jpeg', upsert: false });

            if (!error) {
                synced++;
                const updated = getPendingImages().filter(p => p.id !== img.id);
                localStorage.setItem(PENDING_IMAGES_KEY, JSON.stringify(updated));
            }

            await delay(300);
        } catch (e) {
            console.error('[syncPendingImages] Error sincronizando:', img.id, e);
        }
    }

    console.log('[syncPendingImages] Sincronizadas:', synced, '/', pending.length);
    return synced;
};

// ============================================
// FUNCIÓN PRINCIPAL DE UPLOAD CON REINTENTOS
// ============================================
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 segundo entre reintentos

export const uploadImage = async (file: File, userId: string): Promise<string | null> => {
    console.log('[uploadImage] Iniciando subida de:', file.name, '(', Math.round(file.size / 1024), 'KB)');

    // Verificar si estamos offline
    if (!navigator.onLine) {
        console.log('[uploadImage] Sin conexión, comprimiendo para guardar offline...');
        try {
            const base64 = await compressImage(file);
            return savePendingImage(base64, userId);
        } catch (e) {
            console.error('[uploadImage] Error comprimiendo offline:', e);
            return null;
        }
    }

    // 1. Comprimir imagen directamente a Blob
    let blob: Blob;
    try {
        console.log('[uploadImage] Comprimiendo imagen...');
        blob = await compressImageToBlob(file);
        console.log('[uploadImage] Comprimida a:', Math.round(blob.size / 1024), 'KB');
    } catch (e) {
        console.error('[uploadImage] Error comprimiendo:', e);
        return null;
    }

    // 2. Intentar subir con reintentos
    const fileName = `${userId}/${generateId()}.jpg`;
    let lastError: any = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(`[uploadImage] Intento ${attempt}/${MAX_RETRIES}...`);

            const { error: uploadError } = await supabase.storage
                .from('plant-images')
                .upload(fileName, blob, {
                    contentType: 'image/jpeg',
                    upsert: false
                });

            if (!uploadError) {
                // ¡Éxito!
                console.log('[uploadImage] Subida exitosa en intento', attempt);
                const { data } = supabase.storage
                    .from('plant-images')
                    .getPublicUrl(fileName);

                return data.publicUrl;
            }

            // Error de Supabase
            lastError = uploadError;
            console.warn(`[uploadImage] Error intento ${attempt}:`, uploadError.message);

            // Si es error de duplicado, generar nuevo nombre
            if (uploadError.message?.includes('Duplicate') || uploadError.message?.includes('already exists')) {
                console.log('[uploadImage] Archivo duplicado, generando nuevo nombre...');
                const newFileName = `${userId}/${generateId()}_${attempt}.jpg`;

                const { error: retryError } = await supabase.storage
                    .from('plant-images')
                    .upload(newFileName, blob, {
                        contentType: 'image/jpeg',
                        upsert: false
                    });

                if (!retryError) {
                    const { data } = supabase.storage
                        .from('plant-images')
                        .getPublicUrl(newFileName);
                    return data.publicUrl;
                }
            }

            // Esperar antes del siguiente intento
            if (attempt < MAX_RETRIES) {
                await delay(RETRY_DELAY * attempt); // Delay progresivo
            }

        } catch (e: any) {
            lastError = e;
            console.warn(`[uploadImage] Excepción intento ${attempt}:`, e.message);

            if (attempt < MAX_RETRIES) {
                await delay(RETRY_DELAY * attempt);
            }
        }
    }

    // Todos los intentos fallaron - guardar offline
    console.warn('[uploadImage] Todos los intentos fallaron. Error:', lastError?.message);
    console.log('[uploadImage] Guardando offline como fallback...');

    try {
        // Convertir blob a base64 para guardar offline
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

        return savePendingImage(base64, userId);
    } catch (e) {
        console.error('[uploadImage] Error guardando offline:', e);
        return null;
    }
};

// Resultado de uploadImage con información adicional (para uso futuro)
export interface UploadResult {
    url: string;
    savedOffline: boolean;
}
