import { Link } from 'react-router-dom';
import { Icon } from '../../lib/icons';
import { Card, Avatar, Badge, Button } from '../ui';

/**
 * OwnerCard — high-trust host showcase: Avatar, verified badge, response signal,
 * and direct contact actions. Links through to the full owner profile.
 */
export default function OwnerCard({ owner, ownerId, onCall, waUrl }) {
  const name = owner?.name || owner?.fullName || owner?.displayName || 'Owner / Agent';
  const verified = owner?.verified || owner?.role === 'admin';
  const memberYear = owner?.createdAt
    ? (owner.createdAt.toDate ? owner.createdAt.toDate().getFullYear() : new Date(owner.createdAt).getFullYear())
    : null;
  const responseRate = owner?.responseRate;

  return (
    <Card padding="lg">
      <h3 className="mb-4 text-overline uppercase text-subtle">Hosted by</h3>
      <Link to={`/owner/${ownerId}`} className="group flex items-center gap-3 rounded-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        <div className="relative">
          <Avatar src={owner?.photoURL} name={name} size="xl" ring />
          {verified && (
            <span className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full bg-success text-on-success ring-2 ring-surface" aria-label="Verified">
              <Icon name="verified" className="size-3.5" />
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate text-title-sm text-content transition-colors group-hover:text-primary">
            {name}
          </p>
          <p className="text-body-sm text-muted">View profile &amp; listings →</p>
        </div>
      </Link>

      <div className="mt-4 flex flex-wrap gap-2">
        {verified && <Badge tone="success" size="md" icon={<Icon name="verified" />}>Verified host</Badge>}
        {responseRate != null && <Badge tone="primary" size="md" icon={<Icon name="messages" />}>{responseRate}% response</Badge>}
        {memberYear && <Badge tone="neutral" size="md" icon={<Icon name="calendar" />}>Since {memberYear}</Badge>}
      </div>

      <div className="mt-4 flex gap-2">
        <Button variant="secondary" fullWidth leftIcon={<Icon name="phone" />} onClick={onCall}>Call</Button>
        {waUrl && (
          <Button as="a" href={waUrl} target="_blank" rel="noopener noreferrer" variant="secondary" fullWidth leftIcon={<Icon name="messages" />}>
            WhatsApp
          </Button>
        )}
      </div>
    </Card>
  );
}
