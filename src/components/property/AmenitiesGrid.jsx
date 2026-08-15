import { Icon } from '../../lib/icons';
import { Badge } from '../ui';

/**
 * AmenitiesGrid — categorized amenity + inclusion grid. Each item gets a unified
 * checkmark tile; amenities known to the registry get a themed glyph. Renders
 * two labelled groups (Features / Included), each only when it has content.
 */
// Map common amenity keywords → registry icon concepts (best-effort).
const ICON_HINTS = [
  [/park/i, 'parking'], [/wifi|internet/i, 'wifi'], [/gas|electric|power|generator|ips/i, 'utilities'],
  [/water|wasa/i, 'utilities'], [/lift|elevator/i, 'apartment'], [/cctv|security|guard/i, 'verified'],
  [/balcony|roof|veranda/i, 'room'], [/furnish|sofa|cabinet/i, 'furnished'], [/fire|emergency/i, 'warning'],
];
const iconFor = (name) => ICON_HINTS.find(([re]) => re.test(name))?.[1] || 'check';

function Group({ title, items, tone }) {
  if (!items?.length) return null;
  return (
    <div>
      <h4 className="mb-3 flex items-center gap-2 text-title-sm text-content">
        <Icon name={tone === 'success' ? 'info' : 'utilities'} className="size-5 text-primary" /> {title}
        <Badge tone="neutral" size="sm">{items.length}</Badge>
      </h4>
      <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2.5 text-body-sm text-muted">
            <span className="grid size-7 shrink-0 place-items-center rounded-control bg-surface-sunken text-primary">
              <Icon name={iconFor(item)} className="size-4" />
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AmenitiesGrid({ features, utilities, t }) {
  const hasNone = !features?.length && !utilities?.length;
  if (hasNone) return <p className="text-body-sm text-subtle">No amenities listed.</p>;
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Group title={t?.('amenities') || 'Features'} items={features} tone="primary" />
      <Group title={t?.('inclusions') || 'Included'} items={utilities} tone="success" />
    </div>
  );
}
