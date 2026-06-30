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
            className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md ${
                isActive ? 'border-primary shadow-primary/20 scale-[1.02]' : 'border-slate-200'
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
                    <div className={`flex ${compact ? 'h-24' : 'h-32'} w-full items-center justify-center bg-indigo-50 text-sm font-black text-primary`}>
                        AnyLet
                    </div>
                )}
                <div className={`space-y-1 ${compact ? 'p-2.5' : 'p-4'}`}>
                    <h3 className={`line-clamp-1 font-black text-slate-900 ${compact ? 'text-xs' : 'text-sm'}`}>
                        {listing.title || 'Untitled property'}
                    </h3>
                    <p className={`font-black text-primary ${compact ? 'text-xs' : 'text-sm'}`}>৳{price}</p>
                    <p className={`text-slate-500 ${compact ? 'text-[10px]' : 'text-xs'}`}>{beds} · {baths}</p>
                    <p className={`line-clamp-1 text-slate-500 ${compact ? 'text-[10px]' : 'text-xs'}`}>{location || 'Bangladesh'}</p>
                    {!compact && (
                        <div className="pt-2">
                            <span className="inline-flex rounded-xl bg-primary px-3 py-1.5 text-xs font-black text-white shadow-md shadow-primary/20">
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
