
export const AssetIcon = ({ name, size = 24, className = "" }: { name: string, size?: number, className?: string }) => (
    <img
        src={`./assets/icons/${name}.png`}
        alt={name}
        style={{ width: size, height: size }}
        className={`object-contain ${className}`}
        onError={(e) => {
            // Fallback relative path check
            if (!e.currentTarget.src.includes('retry')) {
                e.currentTarget.src = `assets/icons/${name}.png?retry=1`;
            } else {
                e.currentTarget.style.opacity = '0.3';
            }
        }}
    />
);
