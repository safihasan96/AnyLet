import { memo } from 'react';
import { useNavigate } from 'react-router-dom';

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
        <article className="w-[200px] bg-white">
            {imageUrl ? (
                <img
                    src={imageUrl}
                    alt={listing.title || 'AnyLet property'}
                    loading="lazy"
                    className="h-[120px] w-[200px] rounded-t-lg object-cover"
                />
            ) : (
                <div className="flex h-[120px] w-[200px] items-center justify-center rounded-t-lg bg-[#D1FAE5] text-sm font-semibold text-[#1B4332]">
                    AnyLet
                </div>
            )}
            <div className="space-y-1 p-3">
                <h3 className="truncate text-sm font-semibold text-[#111827]">
                    {listing.title || 'Untitled property'}
                </h3>
                <p className="text-sm font-bold text-[#1B4332]">৳{price}/month</p>
                <p className="text-xs text-[#6B7280]">{beds} · {baths}</p>
                <p className="truncate text-xs text-gray-500">{location || 'Bangladesh'}</p>
                <button
                    type="button"
                    onClick={() => navigate(`/property/${listing.id}`)}
                    className="mt-2 w-full rounded-lg bg-[#1B4332] py-2 text-sm font-semibold text-white transition active:scale-[0.98]"
                >
                    View Details →
                </button>
            </div>
        </article>
    );
}

export default memo(ListingPreviewCard);
