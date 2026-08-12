import { Link } from 'react-router-dom';
import { User, Flag } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * OwnerContactCard — owner/agent summary (links to the owner profile) plus the
 * "Report this ad" link. Presentational; `property` + `id` come from the shell.
 */
export default function OwnerContactCard({ property, id, owner }) {
    const { t } = useLanguage();

    return (
        <>
            {/* Owner Card */}
            <div className="bg-white dark:bg-[#1A1D24] p-6 md:p-8 rounded-3xl md:rounded-[40px] border border-slate-100 dark:border-slate-800/70 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">{t('owner_contact')}</h3>
                <Link to={`/owner/${property.ownerId || property.userId}`} className="flex items-center gap-4 group cursor-pointer">
                    <div className="size-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary dark:text-indigo-400 shadow-inner group-hover:bg-primary group-hover:text-white transition-colors">
                        <User size={32} />
                    </div>
                    <div className="flex-1">
                        <p className="text-lg font-black text-slate-900 dark:text-white leading-none mb-1 group-hover:text-primary dark:text-indigo-400 transition-colors">{owner?.displayName || owner?.name || property?.ownerName || 'Owner / Agent'}</p>
                        <p className="text-sm font-bold text-slate-500">Tap to view profile &amp; ads &gt;</p>
                    </div>
                </Link>
            </div>

            {/* Report Ad Option */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <Link to={`/report-property/${id}`}
                    state={{ property }}
                    className="flex items-center justify-center gap-2 text-slate-400 hover:text-rose-500 font-bold text-sm transition-colors py-2 group"
                >
                    <Flag size={16} className="group-hover:fill-rose-500" /> Report this ad
                </Link>
            </div>
        </>
    );
}
