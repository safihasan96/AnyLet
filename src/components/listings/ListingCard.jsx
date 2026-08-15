import { memo } from 'react';
import { useNavigate } from 'react-router-dom';

function getImageUrl(listing) {
    return listing.imageUrl || listing.images?.[0] || listing.image || '';
}

function ListingCard({ listing, isActive, onMouseEnter, onMouseLeave, compact }) {
    const navigate = useNavigate();
    const imageUrl = getImageUrl(listing);
    const price = Number(listing.rent || listing.price || 0).toLocaleString('en-BD');
    const beds = listing.beds ? `${listing.beds} bed` : 'Bed not set';
    const baths = listing.baths ? `${listing.baths} bath` : 'Bath not set';
    const location = [listing.upazila || listing.thana, listing.district].filter(Boolean).join(', ');

    return (
        <article
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className={`overflow-hidden rounded-card border bg-surface shadow-sm transition-all hover:shadow-md ${
                isActive ? 'border-primary shadow-primary/20 scale-[1.02]' : 'border-border'
            }`}
        >
            <button
                type="button"
                onClick={() => navigate(`/property/${listing.id}`)}
                className="block w-full text-left"
            >
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={listing.title || 'AnyLet property'}
                        loading="lazy"
                        className={`${compact ? 'h-24' : 'h-32'} w-full object-cover`}
                    />
                ) : (
                    <div className={`flex ${compact ? 'h-24' : 'h-32'} w-full items-center justify-center bg-primary/10 text-body-xs font-bold text-primary`}>
                        AnyLet
                    </div>
                )}
                <div className={`space-y-1 ${compact ? 'p-2.5' : 'p-4'}`}>
                    <h3 className={`line-clamp-1 font-bold text-content ${compact ? 'text-caption' : 'text-body-sm'}`}>
                        {listing.title || 'Untitled property'}
                    </h3>
                    <p className={`font-bold text-primary ${compact ? 'text-caption' : 'text-body-sm'}`}>৳{price}</p>
                    <p className={`text-muted ${compact ? 'text-[10px]' : 'text-caption'}`}>{beds} · {baths}</p>
                    <p className={`line-clamp-1 text-subtle ${compact ? 'text-[10px]' : 'text-caption'}`}>{location || 'Bangladesh'}</p>
                    {!compact && (
                        <div className="pt-2">
                            <span className="inline-flex rounded-control bg-primary px-3 py-1.5 text-caption font-bold text-white shadow-md shadow-primary/20">
                                View Details
                            </span>
                        </div>
                    )}
                </div>
            </button>
        </article>
    );
}

export default memo(ListingCard);
