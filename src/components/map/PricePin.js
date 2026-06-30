import L from 'leaflet';

export default function createPricePin(price, isActive) {
    const color = isActive ? '#e11d48' : '#1a227f';
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
            <defs>
                <filter id="shadow" x="-30%" y="-20%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="rgba(0,0,0,0.28)"/>
                </filter>
            </defs>
            <path d="M16 0C9.37 0 4 5.37 4 12c0 9 12 24 12 24S28 21 28 12C28 5.37 22.63 0 16 0z"
                  fill="${color}" filter="url(#shadow)"/>
            <circle cx="16" cy="12" r="5" fill="white" opacity="0.95"/>
        </svg>
    `;
    return L.divIcon({
        className: '',
        html: svg,
        iconSize: [32, 40],
        iconAnchor: [16, 40],
        popupAnchor: [0, -44],
    });
}
