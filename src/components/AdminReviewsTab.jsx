import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Star, ShieldCheck, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export default function AdminReviewsTab({ openModal }) {
    const [propertyReviews, setPropertyReviews] = useState([]);
    const [ownerReviews, setOwnerReviews] = useState([]);
    const [activeTab, setActiveTab] = useState('property'); // 'property' | 'owner'
    const toast = useToast();

    useEffect(() => {
        const unsubProperty = onSnapshot(query(collection(db, 'propertyReviews'), orderBy('createdAt', 'desc')), (snap) => {
            setPropertyReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        const unsubOwner = onSnapshot(query(collection(db, 'ownerReviews'), orderBy('createdAt', 'desc')), (snap) => {
            setOwnerReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => { unsubProperty(); unsubOwner(); };
    }, []);

    const toggleApproval = async (collectionName, id, currentStatus) => {
        try {
            await updateDoc(doc(db, collectionName, id), { isApproved: !currentStatus });
            toast.success(`Review ${!currentStatus ? 'approved' : 'hidden'} successfully`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update status");
        }
    };

    const handleDelete = (collectionName, id) => {
        openModal(
            'Delete Review',
            'Are you sure you want to permanently delete this review? This action cannot be undone.',
            'Delete Permanently',
            'bg-rose-500 hover:bg-rose-600',
            async () => {
                try {
                    await deleteDoc(doc(db, collectionName, id));
                    toast.success("Review deleted");
                } catch (error) {
                    console.error(error);
                    toast.error("Failed to delete review");
                }
            }
        );
    };

    const reviews = activeTab === 'property' ? propertyReviews : ownerReviews;
    const collectionName = activeTab === 'property' ? 'propertyReviews' : 'ownerReviews';

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-zinc-100 pb-4">
                <button 
                    onClick={() => setActiveTab('property')}
                    className={`px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'property' ? 'bg-zinc-950 text-white' : 'bg-zinc-50 text-zinc-500 hover:bg-zinc-100'}`}
                >
                    Property Reviews
                </button>
                <button 
                    onClick={() => setActiveTab('owner')}
                    className={`px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'owner' ? 'bg-zinc-950 text-white' : 'bg-zinc-50 text-zinc-500 hover:bg-zinc-100'}`}
                >
                    Landlord Reviews
                </button>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-zinc-100 bg-zinc-50/50">
                            <th className="p-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Reviewer</th>
                            <th className="p-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Target</th>
                            <th className="p-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Rating</th>
                            <th className="p-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Content</th>
                            <th className="p-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reviews.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="p-8 text-center text-zinc-500 font-bold text-sm">
                                    No reviews found in this category.
                                </td>
                            </tr>
                        ) : (
                            reviews.map(review => (
                                <tr key={review.id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-xl bg-zinc-100 flex items-center justify-center font-bold text-zinc-900 text-xs">
                                                {review.reviewerAvatar ? <img src={review.reviewerAvatar} alt="" className="w-full h-full rounded-xl object-cover" /> : (review.reviewerName?.[0] || 'A')}
                                            </div>
                                            <span className="font-bold text-sm text-zinc-900">{review.reviewerName}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-xs font-bold text-zinc-600 bg-zinc-100 px-2 py-1 rounded-lg">
                                            {activeTab === 'property' ? review.propertyName : 'Landlord Profile'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1">
                                            <Star size={14} className="fill-amber-400 text-amber-400" />
                                            <span className="font-black text-zinc-900 text-sm">{review.rating}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-xs font-medium text-zinc-500 line-clamp-2 max-w-xs" title={review.body}>{review.body}</p>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => toggleApproval(collectionName, review.id, review.isApproved)}
                                                className={`p-2 rounded-xl transition-colors ${review.isApproved ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}
                                                title={review.isApproved ? 'Hide Review' : 'Approve Review'}
                                            >
                                                {review.isApproved ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(collectionName, review.id)}
                                                className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-xl transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
