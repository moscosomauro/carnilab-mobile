// Helper para delay entre operaciones
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================
// CLOUDINARY CONFIGURATION
// ============================================
const CLOUD_NAME = 'dmmrl02uc';
const UPLOAD_PRESET = 'carnilab_uploads';
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;




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
export const savePendingImage = (base64: string, userId: string): string => {
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
            const formData = new FormData();
            formData.append('file', img.base64);
            formData.append('upload_preset', UPLOAD_PRESET);
            formData.append('folder', `carnilab/${img.userId}`);

            const response = await fetch(CLOUDINARY_URL, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
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

export const uploadImage = async (file: File, userId: string): Promise<string | null> => {
    console.log('[uploadImage] Iniciando subida a Cloudinary de:', file.name, '(', Math.round(file.size / 1024), 'KB)');

    // Si estamos offline, ya no intentamos comprimir porque colapsa la app.
    // Simplemente lanzamos un error para que el usuario sepa.
    if (!navigator.onLine) {
        console.warn('[uploadImage] Sin conexión. No se pueden subir fotos offline.');
        throw new Error("Sin conexión a internet. No se pueden subir fotos pesadas en modo offline.");
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', `carnilab/${userId}`);

    try {
        console.log('[uploadImage] Enviando a Cloudinary...');
        const response = await fetch(CLOUDINARY_URL, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`Cloudinary Error: ${response.status} - ${errBody}`);
        }

        const data = await response.json();
        
        // Optimizar URL agregando f_auto,q_auto para que funcione en todos los navegadores (soluciona el problema de fotos de iPhone .heic que no se ven)
        const optimizedUrl = data.secure_url.replace('/upload/', '/upload/f_auto,q_auto/');
        console.log('[uploadImage] Subida exitosa:', optimizedUrl);
        
        return optimizedUrl;

    } catch (e: any) {
        console.error('[uploadImage] Falló subida a Cloudinary. Error:', e.message);
        throw e; // Propagar el error para que AddPlant lo maneje y no se quede pegado
    }
};

// Resultado de uploadImage con información adicional (para uso futuro)
export interface UploadResult {
    url: string;
    savedOffline: boolean;
}
