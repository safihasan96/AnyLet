import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getPropertyCoords } from '../data/locationCoords';

// Fix broken default icon paths caused by bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const TILE_LAYERS = {
    street: {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        label: 'Street',
        icon: '🗺️',
    },
    satellite: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Tiles © Esri',
        label: 'Satellite',
        icon: '🛰️',
    },
    hybrid: {
        url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        attribution: '© Google Maps',
        label: 'Hybrid',
        icon: '🌍',
    },
};

// Custom SVG pin icon
function makePinIcon() {
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
            <defs>
                <filter id="shadow" x="-30%" y="-20%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="rgba(0,0,0,0.28)"/>
                </filter>
            </defs>
            <path d="M16 0C9.37 0 4 5.37 4 12c0 9 12 24 12 24S28 21 28 12C28 5.37 22.63 0 16 0z"
                  fill="#e11d48" filter="url(#shadow)"/>
            <circle cx="16" cy="12" r="5" fill="white" opacity="0.95"/>
        </svg>
    `;
    return L.divIcon({
        className: '',
        html: svg,
        iconSize: [32, 40],
        iconAnchor: [16, 40],
    });
}

export default function LocationPickerMap({ lat, lng, onLocationSelect, division, district, upazila }) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const tileLayerRef = useRef(null);
    const [activeLayer, setActiveLayer] = useState('street');

    // Initialize map
    useEffect(() => {
        if (mapInstanceRef.current) return;

        // Start center
        const defaultCenter = [23.8103, 90.4125]; // Dhaka
        
        const map = L.map(mapRef.current, {
            center: defaultCenter,
            zoom: 12,
            zoomControl: false,
        });

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        const layer = TILE_LAYERS['street'];
        tileLayerRef.current = L.tileLayer(layer.url, {
            maxZoom: 19,
            attribution: layer.attribution
        }).addTo(map);

        mapInstanceRef.current = map;

        // Create marker
        const marker = L.marker(defaultCenter, { 
            icon: makePinIcon(),
            draggable: true 
        }).addTo(map);

        // Update parent state on drag end
        marker.on('dragend', (e) => {
            const position = marker.getLatLng();
            onLocationSelect({ lat: position.lat, lng: position.lng });
        });

        // Update parent state on map click (moves marker)
        map.on('click', (e) => {
            marker.setLatLng(e.latlng);
            onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
        });

        markerRef.current = marker;

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Swap tile layer when activeLayer changes
    useEffect(() => {
        if (!mapInstanceRef.current) return;
        if (tileLayerRef.current) mapInstanceRef.current.removeLayer(tileLayerRef.current);
        const layer = TILE_LAYERS[activeLayer];
        tileLayerRef.current = L.tileLayer(layer.url, {
            attribution: layer.attribution,
            maxZoom: 19,
        }).addTo(mapInstanceRef.current);
    }, [activeLayer]);

    // Update center when location selects change, but only if user hasn't dropped a pin manually
    useEffect(() => {
        if (!mapInstanceRef.current || !markerRef.current) return;
        
        // If we have an exact lat/lng set by the user, ensure marker is there
        if (lat && lng) {
            const newPos = [lat, lng];
            markerRef.current.setLatLng(newPos);
            mapInstanceRef.current.setView(newPos, mapInstanceRef.current.getZoom());
            return;
        }

        // Otherwise auto-center based on dropdown selection
        if (division || district || upazila) {
            const coords = getPropertyCoords({ division, district, upazila });
            if (coords) {
                const newPos = [coords.lat, coords.lng];
                mapInstanceRef.current.setView(newPos, 13);
                markerRef.current.setLatLng(newPos);
                // We do NOT call onLocationSelect here because we only want to save explicit user pins,
                // but setting the marker visually helps them know where they are.
            }
        }
    }, [division, district, upazila, lat, lng]);

    return (
        <div className="relative w-full h-64 rounded-2xl overflow-hidden border-2 border-slate-100 dark:border-slate-800 shadow-inner">
            <div ref={mapRef} className="w-full h-full z-0" />
            
            {/* Status indicator */}
            <div className="absolute top-3 left-3 z-[1000] pointer-events-none">
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-4 py-2 rounded-xl text-xs font-black text-slate-700 dark:text-slate-300 shadow-md inline-block">
                    {lat && lng ? <span className="text-emerald-500">📍 Pinned!</span> : "Tap or drag pin"}
                </div>
            </div>

            {/* Layer switcher */}
            <div className="absolute top-3 right-3 z-[1000] flex bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-xl shadow-md border border-slate-100 dark:border-slate-700 overflow-hidden">
                {Object.entries(TILE_LAYERS).map(([key, layer]) => (
                    <button
                        key={key}
                        onClick={(e) => { e.preventDefault(); setActiveLayer(key); }}
                        className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-black transition-all ${
                            activeLayer === key
                                ? 'bg-primary text-white'
                                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                    >
                        <span>{layer.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
