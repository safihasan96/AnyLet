import { useMemo } from 'react';
import { MapContainer, TileLayer, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getPropertyCoords } from '../../data/locationCoords';
import { Icon } from '../../lib/icons';
import { Button } from '../ui';

/**
 * PropertyLocationMap — neighborhood context via Leaflet. For privacy we never
 * drop an exact pin: coordinates are area-level (getPropertyCoords jitters them)
 * and shown as a soft circle so tenants see the vicinity, not the doorstep.
 * Falls back to an address card if coordinates can't be resolved.
 */
export default function PropertyLocationMap({ property, onOpenFullMap }) {
  // Compute once — getPropertyCoords adds random jitter, so memoize for stability.
  const center = useMemo(() => {
    const lat = Number(property.lat ?? property.latitude);
    const lng = Number(property.lng ?? property.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    return getPropertyCoords(property);
  }, [property]);

  const address = [property.addressDetails, property.upazila, property.district].filter(Boolean).join(', ') || 'Bangladesh';
  const valid = center && Number.isFinite(center.lat) && Number.isFinite(center.lng);

  return (
    <div className="overflow-hidden rounded-card-lg border border-border">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3">
        <p className="inline-flex items-center gap-2 text-body-sm text-content">
          <Icon name="location" className="size-4 text-primary" /> {address}
        </p>
        {onOpenFullMap && (
          <Button variant="ghost" size="sm" rightIcon={<Icon name="chevronRight" />} onClick={onOpenFullMap}>Open map</Button>
        )}
      </div>
      {valid ? (
        <div className="h-64 w-full sm:h-80">
          <MapContainer
            center={[center.lat, center.lng]}
            zoom={14}
            scrollWheelZoom={false}
            className="size-full"
            attributionControl={false}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Circle
              center={[center.lat, center.lng]}
              radius={450}
              pathOptions={{ color: 'var(--anl-primary)', fillColor: 'var(--anl-primary)', fillOpacity: 0.12, weight: 2 }}
            />
          </MapContainer>
        </div>
      ) : (
        <div className="grid h-64 place-items-center bg-surface-sunken text-subtle">
          <Icon name="map" className="size-10" />
        </div>
      )}
      <p className="bg-surface px-4 py-2.5 text-caption text-subtle">
        Exact location is shared after your viewing request is accepted, to protect the host’s privacy.
      </p>
    </div>
  );
}
