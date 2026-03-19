
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QrScanner from 'react-qr-scanner';

// --- COMPONENTS ---

// 1. THE ETHEREAL SCANNER (Real Camera)
const ScannerInterface = () => {
    const navigate = useNavigate();
    const [scannedData, setScannedData] = useState<string | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);

    const handleScan = (data: any) => {
        if (data && data.text) {
            setScannedData(data.text);

            // Logic to parse "carnilab-plant-{id}"
            // Format assumed: "carnilab-plant-12" or full URL "carnilab.app/plant/12"
            const text = data.text;
            let plantId = null;

            if (text.includes("carnilab-plant-")) {
                plantId = text.split("carnilab-plant-")[1];
            }

            if (plantId) {
                // Vibrate success
                if (navigator.vibrate) navigator.vibrate(200);
                // Delay slightly for animation then navigate
                setTimeout(() => navigate(`/plant/${plantId}`), 500);
            }
        }
    };

    const handleError = (err: any) => {
        console.error(err);
        setCameraError("No se pudo acceder a la cámara.");
    };

    return (
        <div className="relative w-[320px] h-[550px] bg-black rounded-[40px] overflow-hidden border-[8px] border-[#1a1a1a] shadow-2xl">
            {/* Real Camera Feed */}
            <div className="absolute inset-0 w-full h-full">
                <QrScanner
                    delay={300}
                    onError={handleError}
                    onScan={handleScan}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    constraints={{
                        audio: false,
                        video: { facingMode: 'environment' }
                    }}
                />
            </div>

            {/* Breathing Frame Overlay */}
            <div className="absolute inset-0 flex items-center justify-center p-12 pointer-events-none">
                <div className={`w-full aspect-square border-[2px] rounded-[30px] transition-all duration-300 relative
                    ${scannedData ? 'border-[#4CAF50] shadow-[0_0_50px_#4CAF50] scale-95' : 'border-white/50 animate-pulse shadow-[0_0_30px_rgba(255,255,255,0.2)]'}
                `}>
                    {/* Corners */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-white rounded-tl-xl"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-white rounded-tr-xl"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-white rounded-bl-xl"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-white rounded-br-xl"></div>
                </div>
            </div>

            {/* UI Interactions */}
            <div className="absolute top-8 w-full text-center pointer-events-none">
                <span className="bg-black/40 backdrop-blur-md text-white text-[10px] px-3 py-1.5 rounded-full font-medium tracking-wide border border-white/10">
                    {cameraError ? cameraError : "Apunta a la etiqueta QR"}
                </span>
            </div>

            {/* Loading / Found State */}
            {scannedData && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-center animate-in fade-in duration-200">
                    <div className="text-4xl mb-4">🌿</div>
                    <h3 className="text-white font-bold text-lg">¡Planta Encontrada!</h3>
                    <p className="text-white/60 text-xs">Cargando ficha...</p>
                </div>
            )}
        </div>
    );
};

export const QRDesignShowcase = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-[#F5F1EB] flex flex-col items-center py-12 px-4 gap-8 font-display">
            <div className="w-full max-w-md flex justify-between items-center px-4">
                <button onClick={() => navigate(-1)} className="text-[#8E877F] font-bold">← Volver</button>
                <h1 className="text-xl font-black text-[#2E2E2E]">Escáner CarniLab</h1>
            </div>

            <p className="text-xs text-center max-w-[250px] text-[#8E877F] mb-4">
                Usa este escáner para acceder rápidamente a la ficha de tus plantas etiquetadas.
            </p>

            {/* The Scanner */}
            <ScannerInterface />

        </div>
    );
};
