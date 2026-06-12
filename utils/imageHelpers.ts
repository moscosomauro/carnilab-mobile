// ============================================
// IMAGE HELPERS - 100% LOCAL
// Las imágenes se comprimen y se guardan como data URLs
// (base64) directamente en los datos locales. Sin Cloudinary.
// La migración a IndexedDB (blobs) llega en la fase de base
// de datos local.
// ============================================

// Comprime una imagen a JPEG 800px máx, calidad 0.7, como data URL
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

// Una imagen "offline" es una data URL embebida (vs URL http de la época de la nube)
export const isOfflineImage = (url: string): boolean => {
    return url?.startsWith('data:image') || false;
};

// "Subir" una imagen ahora significa comprimirla y devolverla como data URL local
export const uploadImage = async (file: File, _userId: string): Promise<string | null> => {
    return compressImage(file);
};

// --- Compatibilidad con la antigua cola de sync (ya no existe nube) ---
export const getPendingImages = (): never[] => [];
export const getPendingImagesCount = (): number => 0;
export const syncPendingImages = async (): Promise<number> => 0;
export const savePendingImage = (base64: string, _userId: string): string => base64;
