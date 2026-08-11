import EnquiryCard from './EnquiryCard';

/**
 * AdminEnquiriesTab — support-enquiry inbox. Presentational; data + handlers
 * come from the AdminPanel shell.
 */
export default function AdminEnquiriesTab({ enquiries, onReply, onResolve, onDelete }) {
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
                <div className="px-8 py-8 border-b border-zinc-50">
                    <h3 className="text-2xl font-black text-zinc-950">Support Enquiries</h3>
                    <p className="text-sm text-zinc-400 font-bold mt-1">
                        {enquiries.length} total tickets · <span className="text-red-500">{enquiries.filter(e => e.status !== 'resolved').length} needs attention</span>
                    </p>
                </div>

                <div className="divide-y divide-zinc-50">
                    {enquiries.length === 0 ? (
                        <div className="px-8 py-16 text-center text-zinc-400 font-bold">
                            No enquiries found.
                        </div>
                    ) : enquiries.map(enquiry => (
                        <EnquiryCard
                            key={enquiry.id}
                            enquiry={enquiry}
                            onReply={onReply}
                            onResolve={onResolve}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
