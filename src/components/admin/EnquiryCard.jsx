import { useRef, useMemo } from 'react';
import { Trash2 } from 'lucide-react';

/**
 * EnquiryCard — a single support-enquiry thread (original message + admin/user
 * replies) with an inline reply form. Self-contained; state is driven by props.
 */
export default function EnquiryCard({ enquiry, onReply, onResolve, onDelete }) {
    const formRef = useRef(null);

    // Build conversation: merge legacy adminReply + new replies array
    const thread = useMemo(() => {
        const msgs = [];
        // User's original message
        msgs.push({ text: enquiry.description, sender: 'user', sentAt: enquiry.createdAt?.toDate?.()?.toISOString() || '' });
        // Legacy single reply (only if no replies array yet)
        if (enquiry.adminReply && (!enquiry.replies || enquiry.replies.length === 0)) {
            msgs.push({ text: enquiry.adminReply, sender: 'admin', sentAt: enquiry.repliedAt?.toDate?.()?.toISOString() || '' });
        }
        // New multi-message replies
        if (enquiry.replies?.length) {
            enquiry.replies.forEach(r => msgs.push(r));
        }
        return msgs;
    }, [enquiry]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const reply = e.target.reply.value.trim();
        if (reply) onReply(enquiry.id, reply, formRef);
    };

    return (
        <div className="p-6 md:p-8 hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-all border-b border-slate-100 dark:border-white/[0.05] last:border-0">
            {/* Header */}
            <div className="flex justify-between items-start mb-5">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-white/[0.06] rounded-2xl flex items-center justify-center font-black text-slate-500 dark:text-slate-400 text-lg">
                        {enquiry.userEmail?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-black text-zinc-950">{enquiry.topic}</p>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${enquiry.type === 'support' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                                {enquiry.type || 'Support'}
                            </span>
                            {enquiry.status === 'resolved' ? (
                                <span className="text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest bg-emerald-50 text-emerald-600">
                                    ✓ Resolved
                                </span>
                            ) : (
                                <span className="text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest bg-red-50 text-red-500">
                                    Pending
                                </span>
                            )}
                        </div>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-0.5">{enquiry.userEmail}</p>
                        <p className="text-[10px] font-medium text-slate-300 dark:text-slate-600 mt-0.5">
                            {enquiry.createdAt?.toDate().toLocaleString()}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {enquiry.status !== 'resolved' && (
                        <button
                            onClick={() => onResolve(enquiry.id)}
                            className="text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                        >
                            ✓ Resolve
                        </button>
                    )}
                    <button onClick={() => onDelete(enquiry.id)} className="p-2 text-zinc-300 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* Conversation thread */}
            <div className="space-y-3 mb-5 ml-4 border-l-2 border-slate-100 dark:border-white/[0.06] pl-5">
                {thread.map((msg, idx) => (
                    <div key={idx} className={`${msg.sender === 'admin' ? 'ml-4' : ''}`}>
                        <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${msg.sender === 'admin' ? 'text-emerald-600' : 'text-zinc-400'}`}>
                            {msg.sender === 'admin' ? '🔷 Admin' : '💬 User'}
                            {msg.sentAt && (
                                <span className="ml-2 font-medium lowercase tracking-normal">
                                    · {new Date(msg.sentAt).toLocaleString()}
                                </span>
                            )}
                        </p>
                        <p className={`text-sm font-medium leading-relaxed p-4 rounded-xl ${msg.sender === 'admin' ? 'bg-emerald-50/70 dark:bg-emerald-500/10 text-emerald-900 dark:text-emerald-300' : 'bg-slate-50 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300'}`}>
                            {msg.text}
                        </p>
                    </div>
                ))}
            </div>

            {/* Reply form — always visible unless resolved */}
            {enquiry.status !== 'resolved' && (
                <div className="ml-4 pl-5 border-l-2 border-dashed border-slate-200 dark:border-white/[0.08]">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Send a Reply</p>
                    <form ref={formRef} onSubmit={handleSubmit} className="flex gap-3">
                        <input
                            name="reply"
                            placeholder="Type your reply here..."
                            className="flex-1 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 dark:focus:border-emerald-500 transition-all"
                        />
                        <button
                            type="submit"
                            className="px-5 py-2.5 bg-slate-900 dark:bg-white/[0.08] text-white text-xs font-black rounded-xl hover:bg-emerald-600 dark:hover:bg-emerald-600 transition-all whitespace-nowrap"
                        >
                            Send Reply
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
