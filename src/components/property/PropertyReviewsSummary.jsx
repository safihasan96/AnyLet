import { Link } from 'react-router-dom';
import { Star, ChevronRight } from 'lucide-react';

/**
 * PropertyReviewsSummary — bottom full-width review summary card with overall
 * rating and a link to the full reviews page. Renders nothing when the property
 * has no reviews. Presentational; `property` comes from the shell.
 */
export default function PropertyReviewsSummary({ property }) {
    if (!(property.reviewCount > 0)) return null;

    return (
        <div className="mt-8 mb-6 px-4 md:px-0">
            <div className="bg-white dark:bg-[#1A1D24] rounded-[32px] md:rounded-[40px] p-6 md:p-10 border border-slate-100 dark:border-slate-800/70 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6 w-full md:w-auto">
                    <div className="size-16 rounded-3xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                        <Star size={28} className="fill-amber-500" />
                    </div>
                    <div>
                        <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-1">Guest Reviews</h3>
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                            <span className="text-slate-900 dark:text-white text-base">{property.reviewScore?.toFixed(1)} overall rating</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                            <span>Based on {property.reviewCount} reviews</span>
                        </div>
                    </div>
                </div>
                <Link to={`/property/${property.id}/reviews`}
                    className="w-full md:w-auto px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 shrink-0"
                >
                    Read all reviews <ChevronRight size={18} />
                </Link>
            </div>
        </div>
    );
}
