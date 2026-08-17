import { Icon } from '../../lib/icons';

/**
 * SpecsGrid — the at-a-glance stat row: beds, baths, area, furnishing. Unified
 * lucide icons on raised pill tiles. Falls back gracefully on missing values.
 */
export default function SpecsGrid({ property, t }) {
  const specs = [
    { icon: 'bed', label: t?.('bedrooms') || 'Bedrooms', value: property.beds ?? '—' },
    { icon: 'bath', label: t?.('bathrooms') || 'Bathrooms', value: property.baths ?? '—' },
    { icon: 'area', label: 'Area', value: property.area ? `${property.area} ${t?.('sqft') || 'sqft'}` : '—' },
    { icon: 'furnished', label: 'Furnishing', value: property.furnishing || property.furnishingStatus || 'Unfurnished' },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {specs.map((s) => (
        <div key={s.label} className="flex flex-col items-center gap-1.5 rounded-card bg-surface-raised px-3 py-4 text-center shadow-card">
          <span className="grid size-10 place-items-center rounded-control bg-primary-subtle text-primary">
            <Icon name={s.icon} className="size-5" />
          </span>
          <span className="text-title-sm text-content">{s.value}</span>
          <span className="text-caption text-subtle">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
