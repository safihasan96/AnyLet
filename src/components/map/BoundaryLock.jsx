import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export default function BoundaryLock({ bounds, minZoom, maxZoom }) {
    const map = useMap();

    useEffect(() => {
        map.setMaxBounds(bounds);
        map.setMinZoom(minZoom);
        map.setMaxZoom(maxZoom);
        // eslint-disable-next-line react-hooks/immutability
        map.options.maxBoundsViscosity = 1.0;
    }, [bounds, map, maxZoom, minZoom]);

    return null;
}
