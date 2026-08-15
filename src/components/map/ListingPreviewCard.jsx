import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui';

function getImageUrl(listing) {
    return listing.imageUrl || listing.images?.[0] || listing.image || '';
}

function ListingPreviewCard({ listing }) {
    const navigate = useNavigate();
    const imageUrl = getImageUrl(listing);
    const price = Number(listing.rent || listing.price || 0).toLocaleString('en-BD');
    const beds = listing.beds ? `${listing.beds} bed` : 'Bed not set';
    const baths = listing.baths ? `${listing.baths} bath` : 'Bath not set';
    const location = [listing.upazila || listing.thana, listing.district].filter(Boolean).join(', ');

    return (
        <article className="w-[200px] bg-surface">
            {imageUrl ? (
                <img
                    src={imageUrl}
                    alt={listing.title || 'AnyLet property'}
                    loading="lazy"
                    className="h-[120px] w-[200px] rounded-t-card object-cover"
                />
            ) : (
                <div className="flex h-[120px] w-[200px] items-center justify-center rounded-t-card bg-primary/10 text-body-xs font-bold text-primary">
                    AnyLet
                </div>
            )}
            <div className="space-y-1 p-3">
                <h3 className="truncate text-body-sm font-bold text-content">
                    {listing.title || 'Untitled property'}
                </h3>
                <p className="text-body-sm font-bold text-success">৳{price}/month</p>
                <p className="text-caption text-muted">{beds} · {baths}</p>
                <p className="truncate text-caption text-subtle">{location || 'Bangladesh'}</p>
                <Button
                    size="sm"
                    fullWidth
                    className="mt-2"
                    onClick={() => navigate(`/property/${listing.id}`)}
                >
                    View Details →
                </Button>
            </div>
        </article>
    );
}

export default memo(ListingPreviewCard);
