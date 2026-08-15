import { Icon } from '../../lib/icons';
import { Button } from '../ui';

/**
 * MobileBookingBar — floating conversion bar for mobile. Translucent
 * (surface-blur, content scrolls under), shows the monthly price + primary CTA.
 * Sits above the device home indicator via safe-area padding.
 */
export default function MobileBookingBar({ property, available, requestSent, requestSending, primaryLabel, onPrimary }) {
  const cycle = (property.billingCycle || 'month').toLowerCase();
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border surface-blur lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <div className="min-w-0">
          <p className="flex items-baseline gap-1">
            <span className="font-display text-title-md text-content">৳{property.rent?.toLocaleString()}</span>
            <span className="text-caption text-muted">/ {cycle}</span>
          </p>
          {property.utilitiesCost ? (
            <p className="text-caption text-subtle">+ ৳{property.utilitiesCost.toLocaleString()} utilities</p>
          ) : (
            <p className="text-caption text-subtle">Utilities included</p>
          )}
        </div>
        {available ? (
          <Button
            size="lg"
            className="shrink-0"
            disabled={requestSent || requestSending}
            loading={requestSending}
            leftIcon={requestSent ? <Icon name="check" /> : <Icon name="calendar" />}
            onClick={onPrimary}
          >
            {requestSent ? 'Requested' : primaryLabel}
          </Button>
        ) : (
          <span className="shrink-0 rounded-control bg-surface-sunken px-4 py-2 text-body-sm font-medium text-muted">{property.status}</span>
        )}
      </div>
    </div>
  );
}
