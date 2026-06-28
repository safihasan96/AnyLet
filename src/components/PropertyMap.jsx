import { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPropertyCoords } from '../data/locationCoords';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
        attribution: 'Tiles © Esri — Source: Esri, USGS, NOAA',
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

function formatBDT(amount) {
    if (!amount) return 'N/A';
    return '৳' + Number(amount).toLocaleString('en-IN');
}

// Custom SVG pin icon — clean teardrop shape with the brand color
function makePinIcon(isHighlighted = false) {
    const color = isHighlighted ? '#e11d48' : '#1a227f';
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

export default function PropertyMap({ properties = [], defaultLayer = 'street', showLayerControl = true, centerProperty = null }) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const tileLayerRef = useRef(null);
    const navigate = useNavigate();
    const [activeLayer, setActiveLayer] = useState(defaultLayer);

    // Merge centerProperty into the list if it's not already there
    const mergedProperties = useMemo(() => {
        if (!centerProperty) return properties;
        const alreadyIncluded = properties.some(p => p.id === centerProperty.id);
        return alreadyIncluded ? properties : [centerProperty, ...properties];
    }, [properties, centerProperty]);

    // Initialize map once
    useEffect(() => {
        if (mapInstanceRef.current) return;

        const map = L.map(mapRef.current, {
            center: [23.8103, 90.4125],
            zoom: 10,
            zoomControl: false,
            attributionControl: true,
        });

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        const layer = TILE_LAYERS[defaultLayer];
        tileLayerRef.current = L.tileLayer(layer.url, {
            attribution: layer.attribution,
            maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;

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

    // Render pin markers whenever properties change
    useEffect(() => {
        if (!mapInstanceRef.current) return;
        const map = mapInstanceRef.current;

        markersRef.current.forEach(m => map.removeLayer(m));
        markersRef.current = [];

        if (mergedProperties.length === 0) return;

        const bounds = [];
        const isCenterProp = (p) => centerProperty && p.id === centerProperty.id;

        mergedProperties.forEach(property => {
            const coords = property.lat && property.lng
                ? { lat: Number(property.lat), lng: Number(property.lng) }
                : getPropertyCoords(property);

            if (!coords) return;
            bounds.push([coords.lat, coords.lng]);

            const marker = L.marker([coords.lat, coords.lng], { icon: makePinIcon(isCenterProp(property)) });

            // Build the popup HTML — price-focused, clean card
            const imageUrl = property.images?.[0] || property.imageUrl || property.image_url || '';
            const rent = formatBDT(property.rent);
            const cycle = property.billingCycle || 'Month';
            const title = property.title || 'Unnamed Property';
            const location = [property.upazila, property.district].filter(Boolean).join(', ');
            const beds = property.beds ? `${property.beds} Bed` : '';
            const baths = property.baths ? `${property.baths} Bath` : '';
            const specs = [beds, baths].filter(Boolean).join(' · ');

            const popupHtml = `
                <div class="pin-popup">
                    ${imageUrl ? `<img loading="lazy" src="${imageUrl}" alt="${title}" class="pin-popup__img" />` : '<div class="pin-popup__img pin-popup__img--empty">🏠</div>'}
                    <div class="pin-popup__body">
                        <div class="pin-popup__rent">${rent}<span> / ${cycle}</span></div>
                        <div class="pin-popup__title">${title}</div>
                        ${location ? `<div class="pin-popup__loc">📍 ${location}</div>` : ''}
                        ${specs ? `<div class="pin-popup__specs">${specs}</div>` : ''}
                        <button class="pin-popup__btn" data-id="${property.id}">View Details →</button>
                    </div>
                </div>
            `;

            marker.bindPopup(popupHtml, {
                className: 'pin-popup-wrapper',
                maxWidth: 260,
                minWidth: 220,
            });

            // Switch to highlighted pin while popup is open
            marker.on('popupopen', () => {
                marker.setIcon(makePinIcon(true));
                setTimeout(() => {
                    const btn = document.querySelector(`.pin-popup__btn[data-id="${property.id}"]`);
                    if (btn) btn.addEventListener('click', () => navigate(`/property/${property.id}`));
                }, 50);
            });
            marker.on('popupclose', () => marker.setIcon(makePinIcon(false)));

            marker.addTo(map);
            markersRef.current.push(marker);
        });

        if (bounds.length > 0) {
            try {
                if (centerProperty) {
                    // If we have a focal property, fly directly to it instead of fitting all bounds
                    const focusCoords = centerProperty.lat && centerProperty.lng
                        ? { lat: Number(centerProperty.lat), lng: Number(centerProperty.lng) }
                        : getPropertyCoords(centerProperty);
                    if (focusCoords) {
                        map.flyTo([focusCoords.lat, focusCoords.lng], 16, { animate: true, duration: 1.2 });
                        // Auto-open the center property's popup
                        setTimeout(() => {
                            const targetMarker = markersRef.current.find(m => {
                                const ll = m.getLatLng();
                                return Math.abs(ll.lat - focusCoords.lat) < 0.0001 && Math.abs(ll.lng - focusCoords.lng) < 0.0001;
                            });
                            if (targetMarker) targetMarker.openPopup();
                        }, 1300);
                    }
                } else {
                    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
                }
            } catch (_) {}
        }
    }, [mergedProperties, navigate, centerProperty]);

    return (
        <div className="relative w-full h-full">
            {/* Map canvas */}
            <div ref={mapRef} className="w-full h-full" />

            {/* Layer switcher */}
            {showLayerControl && (
                <div className="map-layer-control absolute z-[1000] bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                    {Object.entries(TILE_LAYERS).map(([key, layer]) => (
                        <button
                            key={key}
                            onClick={() => setActiveLayer(key)}
                            className={`flex min-w-0 items-center justify-center gap-1 px-2.5 py-2.5 text-[10px] font-black transition-all sm:gap-1.5 sm:text-[11px] md:px-4 md:text-xs ${
                                activeLayer === key
                                    ? 'bg-primary text-white'
                                    : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                        >
                            <span className="hidden shrink-0 sm:inline">{layer.icon}</span>
                            <span className="min-w-0 truncate">{layer.label}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Property count pill */}
            <div
                className="absolute left-4 z-[1000]"
                style={{ bottom: 'calc(5.5rem + max(env(safe-area-inset-bottom), 0.75rem))' }}
            >
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-lg border border-slate-100 dark:border-slate-700 flex items-center gap-2">
                    <span className="size-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs font-black text-slate-900 dark:text-white">{properties.length} properties</span>
                </div>
            </div>
        </div>
    );
}
