import { Flag, Search, Trash2, CheckCircle } from 'lucide-react';

/**
 * AdminReportsTab — property abuse/content reports with moderation actions.
 * Presentational; data + handlers come from the AdminPanel shell.
 */
export default function AdminReportsTab({ reports, onViewProperty, onDeleteReported, onDismiss }) {
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
                <div className="px-8 py-8 border-b border-zinc-50">
                    <h3 className="text-2xl font-black text-zinc-950">Property Reports</h3>
                    <p className="text-sm text-zinc-400 font-bold mt-1">
                        {reports.length} active reports · <span className="text-rose-500">Security & Content Moderation</span>
                    </p>
                </div>

                <div className="divide-y divide-zinc-50">
                    {reports.length === 0 ? (
                        <div className="px-8 py-16 text-center text-zinc-400 font-bold">
                            No property reports found. Excellent!
                        </div>
                    ) : reports.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)).map(report => (
                        <div key={report.id} className="p-8 hover:bg-rose-50/[0.02] transition-all border-l-4 border-transparent hover:border-rose-500">
                            <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
                                            <Flag size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Reason: {report.reason}</p>
                                            <h4 className="text-lg font-black text-zinc-950 leading-tight">
                                                {report.propertyTitle}
                                            </h4>
                                            <p className="text-xs font-bold text-zinc-400 mt-1">Property ID: {report.propertyId}</p>
                                        </div>
                                    </div>

                                    <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100">
                                        <p className="text-sm text-zinc-600 font-medium leading-relaxed italic">
                                            "{report.details || 'No additional details provided.'}"
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-6 items-center">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 bg-zinc-200 rounded-lg flex items-center justify-center text-[10px] font-black text-zinc-600 uppercase">
                                                {report.reporterName?.[0] || 'U'}
                                            </div>
                                            <p className="text-xs font-bold text-zinc-500">Reporter: <span className="text-zinc-900">{report.reporterName}</span></p>
                                        </div>
                                        <p className="text-xs font-bold text-zinc-400">
                                            Email: <span className="text-zinc-700">{report.reporterEmail}</span>
                                        </p>
                                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                            {report.createdAt?.toDate()?.toLocaleString() || 'Just now'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-row lg:flex-col gap-3 w-full lg:w-48">
                                    <button
                                        onClick={() => onViewProperty(report.propertyId)}
                                        className="flex-1 py-3 px-4 bg-zinc-950 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Search size={14} /> View Ad
                                    </button>
                                    <button
                                        onClick={() => onDeleteReported(report)}
                                        className="flex-1 py-3 px-4 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={14} /> Delete Ad
                                    </button>
                                    <button
                                        onClick={() => onDismiss(report.id)}
                                        className="flex-1 py-3 px-4 bg-zinc-100 text-zinc-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle size={14} /> Dismiss
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
