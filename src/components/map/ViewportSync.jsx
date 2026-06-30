import { useCallback, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

export default function ViewportSync({
    allListings,
    setVisibleListings,
    setHasPanned,
    setCurrentBounds,
}) {
    const map = useMap();
    const debounceRef = useRef(null);
    const hasMountedRef = useRef(false);

    const syncToViewport = useCallback(() => {
        const bounds = map.getBounds();
        setCurrentBounds(bounds);
        setVisibleListings(
            allListings.filter((listing) => bounds.contains([listing.lat, listing.lng]))
        );
    }, [allListings, map, setCurrentBounds, setVisibleListings]);

    useEffect(() => {
        syncToViewport();
        hasMountedRef.current = true;
    }, [syncToViewport]);

    useEffect(() => {
        const handleViewportChange = () => {
            window.clearTimeout(debounceRef.current);
            debounceRef.current = window.setTimeout(() => {
                syncToViewport();
                if (hasMountedRef.current) setHasPanned(true);
            }, 150);
        };

        map.on('moveend', handleViewportChange);
        map.on('zoomend', handleViewportChange);

        return () => {
            window.clearTimeout(debounceRef.current);
            map.off('moveend', handleViewportChange);
            map.off('zoomend', handleViewportChange);
        };
    }, [map, setHasPanned, syncToViewport]);

    return null;
}
