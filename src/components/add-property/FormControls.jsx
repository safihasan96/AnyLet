/**
 * Shared form primitives for the AddProperty wizard — extracted so every step
 * component can reuse the same styled inputs.
 */

export function Section({ title, icon, children }) {
    return (
        <div className="bg-white dark:bg-[#1A1D24] p-6 rounded-3xl border border-slate-100 dark:border-white/[0.06] shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-primary dark:text-indigo-400">
                {icon}
                <h3 className="font-black uppercase text-xs tracking-widest">{title}</h3>
            </div>
            {children}
        </div>
    );
}

export function Input({ label, ...props }) {
    return (
        <div className="space-y-1">
            <label className="text-[10px] uppercase font-black text-slate-400 ml-1 tracking-widest">{label}</label>
            <input
                className="w-full bg-slate-50 dark:bg-[#222630] border-none rounded-xl py-3 px-4 font-bold text-slate-900 dark:text-white placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                {...props}
            />
        </div>
    );
}

export function PreviewInfo({ label, value }) {
    return (
        <div>
            <p className="text-[9px] uppercase font-black text-slate-400 tracking-[0.1em]">{label}</p>
            <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{value}</p>
        </div>
    );
}

export function Select({ label, children, ...props }) {
    return (
        <div className="space-y-1">
            <label className="text-[10px] uppercase font-black text-slate-400 ml-1 tracking-widest">{label}</label>
            <div className="relative">
                <select
                    className="w-full bg-slate-50 dark:bg-[#222630] border-none rounded-xl py-3 px-4 font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none disabled:opacity-50"
                    {...props}
                >
                    {children}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronDown size={16} />
                </div>
            </div>
        </div>
    );
}

export function Textarea({ label, ...props }) {
    return (
        <div className="space-y-1">
            <label className="text-[10px] uppercase font-black text-slate-400 ml-1 tracking-widest">{label}</label>
            <textarea
                className="w-full bg-slate-50 dark:bg-[#222630] border-none rounded-xl py-3 px-4 font-bold text-slate-900 dark:text-white placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-primary/50 transition-all h-32"
                {...props}
            />
        </div>
    );
}

export function ChevronDown({ size, className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 9 6 6 6-6" /></svg>
    );
}
