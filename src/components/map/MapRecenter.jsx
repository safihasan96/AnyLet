import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export default function MapRecenter({ targetLocation }) {
    const map = useMap();

    useEffect(() => {
        if (targetLocation && typeof targetLocation.lat === 'number' && typeof targetLocation.lng === 'number') {
            map.flyTo([targetLocation.lat, targetLocation.lng], 14, {
                duration: 1.5,
                easeLinearity: 0.25,
            });
        }
    }, [targetLocation, map]);

    return null;
}
