
import { useState, useEffect } from 'react';

// Mapeo directo por palabras clave (búsqueda en minúsculas)
const getSpeciesIcon = (species: string): string => {
    if (!species) return 'dionaeas'; // Default fallback

    const lowerSpecies = species.toLowerCase();

    // Orden de prioridad: más específico primero
    if (lowerSpecies.includes('dionaea') || lowerSpecies.includes('venus') || lowerSpecies.includes('flytrap')) {
        return 'dionaeas';
    }
    if (lowerSpecies.includes('nepenthes') || lowerSpecies.includes('nephentes')) {
        return 'nephentes';
    }
    if (lowerSpecies.includes('sarracenia') || lowerSpecies.includes('pitcher')) {
        return 'sarracenias';
    }
    if (lowerSpecies.includes('drosera') || lowerSpecies.includes('sundew')) {
        return 'droseras';
    }
    if (lowerSpecies.includes('pinguicula')) {
        return 'pinguicula';
    }
    if (lowerSpecies.includes('utricularia')) {
        return 'Utricularia';
    }
    if (lowerSpecies.includes('cephalotus')) {
        return 'cephalotus';
    }
    if (lowerSpecies.includes('heliamphora')) {
        return 'Heliamphora';
    }
    if (lowerSpecies.includes('darlingtonia')) {
        return 'darlingtonia';
    }
    if (lowerSpecies.includes('byblis')) {
        return 'Byblis';
    }

    // Fallback genérico
    return 'dionaeas';
};

export const SpeciesIcon = ({ species, size = 24, className = "" }: { species: string, size?: number, className?: string }) => {
    const [hasError, setHasError] = useState(false);

    // Calcular el src directamente (no usar state para evitar re-renders)
    const iconName = getSpeciesIcon(species);
    const imageSrc = `/assets/icons/species/${iconName}.png?v=2`; // Cache buster

    useEffect(() => {
        // Reset cuando cambia la especie
        setHasError(false);
    }, [species]);

    if (hasError) {
        // Fallback genérico solo si falla la carga
        return (
            <div className={`flex items-center justify-center bg-gray-100 rounded-full opacity-50 ${className}`} style={{ width: size, height: size }}>
                <span className="text-[10px]">🌿</span>
            </div>
        );
    }

    return (
        <img
            key={imageSrc}
            src={imageSrc}
            alt={species}
            style={{ width: size, height: size }}
            className={`object-contain ${className}`}
            onError={() => {
                console.error(`❌ Failed to load icon: ${imageSrc} for species: ${species}`);
                setHasError(true);
            }}
            onLoad={() => {
                console.log(`✅ Successfully loaded icon: ${imageSrc} for species: ${species}`);
            }}
        />
    );
};
