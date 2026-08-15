import { cn } from '../../lib/cn';
import { Icon } from '../../lib/icons';
import { Card, Button, Badge } from '../ui';

/**
 * BookingPanel — the desktop sticky conversion box. High-elevation Card that
 * sticks during scroll. Price in Outfit display, utilities note, escrow badge,
 * availability + 48h-cooldown states, and the primary CTAs. All actions are
 * injected so the page keeps ownership of the business logic.
 */
export default function BookingPanel({
  property, isOwner, available, requestSent, requestSending,
  onBook, onRequest, onCall, waUrl, t, className,
}) {
  const cycle = property.billingCycle || 'month';

  if (isOwner) {
    return (
      <Card variant="raised" padding="lg" className={cn('bg-primary-subtle text-center', className)}>
        <h3 className="text-overline uppercase text-primary">Your property</h3>
        <p className="mt-2 text-body-sm text-muted">You are viewing your own listing.</p>
      </Card>
    );
  }

  return (
    <Card variant="raised" padding="lg" className={className}>
      {/* Price */}
      <div className="flex items-baseline gap-1.5">
        <span className="font-display text-display-md text-content">৳{property.rent?.toLocaleString()}</span>
        <span className="text-body-sm text-muted">/ {cycle.toLowerCase()}</span>
      </div>
      <p className="mt-1 inline-flex items-center gap-1.5 text-body-sm text-muted">
        <Icon name="utilities" className="size-4 text-warning" />
        {property.utilitiesCost ? `+ ৳${property.utilitiesCost.toLocaleString()} utilities` : 'Utilities included'}
      </p>

      {/* Escrow trust */}
      {property.securityDeposit > 0 && (
        <div className="mt-4 flex items-center gap-2.5 rounded-card bg-success-subtle p-3">
          <Icon name="locked" className="size-5 shrink-0 text-success" />
          <p className="text-caption text-content">
            <span className="font-semibold">৳{property.securityDeposit.toLocaleString()}</span> deposit secured via Any-Let Escrow — 100% refundable.
          </p>
        </div>
      )}

      {/* Actions / availability */}
      <div className="mt-5">
        {available ? (
          <div className="flex flex-col gap-3">
            {(property.instantBooking || property.securityDeposit > 0) && (
              <Button size="lg" fullWidth leftIcon={<Icon name="verified" />} onClick={onBook}>Book now</Button>
            )}
            <Button
              size="lg" fullWidth
              variant={property.instantBooking || property.securityDeposit > 0 ? 'secondary' : 'primary'}
              disabled={requestSent || requestSending}
              loading={requestSending}
              leftIcon={requestSent ? <Icon name="check" /> : <Icon name="calendar" />}
              onClick={onRequest}
            >
              {requestSent ? 'Request sent' : t('request_viewing')}
            </Button>
            <Button size="lg" fullWidth variant="secondary" leftIcon={<Icon name="phone" />} onClick={onCall}>{t('call_owner')}</Button>
            {waUrl && (
              <Button as="a" href={waUrl} target="_blank" rel="noopener noreferrer" size="lg" fullWidth variant="soft" leftIcon={<Icon name="messages" />}>
                Contact on WhatsApp
              </Button>
            )}
          </div>
        ) : (
          <div className={cn('rounded-card border p-4 text-center text-body-sm font-medium',
            property.status === 'Booked' ? 'border-info/30 bg-info-subtle text-info' : 'border-danger/30 bg-danger-subtle text-danger')}>
            <Badge tone={property.status === 'Booked' ? 'info' : 'danger'} size="md" className="mb-2">{property.status}</Badge>
            <p>This property is no longer available for viewings.</p>
          </div>
        )}
      </div>

      {/* Cooldown note */}
      {available && requestSent && (
        <p className="mt-3 flex items-center gap-1.5 text-caption text-muted">
          <Icon name="time" className="size-3.5" /> You’ve already requested — you can send another after 48 hours.
        </p>
      )}
    </Card>
  );
}
