'use client';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import {
    collection, addDoc, query, where, onSnapshot,
    serverTimestamp, orderBy, limit
} from 'firebase/firestore';
import {
    ArrowLeft, Send, MessageSquare, Clock,
    CheckCircle, AlertCircle, Plus, ChevronRight, X,
    Search, Filter, CheckCircle2
} from 'lucide-react';
import { Skeleton } from '../components/Skeleton';
import QUERY_LIMITS from '../config/queryLimits';
import logger from '../utils/logger';

export default function Enquiry() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [enquiries, setEnquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [selectedEnquiry, setSelectedEnquiry] = useState(null);
    const [topic, setTopic] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!currentUser) return;

        // Note: This query may require a composite index in Firestore.
        // If it fails, check the browser console for the direct link to create the index.
        try {
            const q = query(
                collection(db, 'enquiries'),
                where('userId', '==', currentUser.uid),
                limit(QUERY_LIMITS.ENQUIRIES)
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const list = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })).sort((a, b) => {
                    const dateA = a.updatedAt?.toDate() || a.createdAt?.toDate() || new Date(0);
                    const dateB = b.updatedAt?.toDate() || b.createdAt?.toDate() || new Date(0);
                    return dateB - dateA;
                });
                setEnquiries(list);
                setLoading(false);
                setError(null);
            }, (err) => {
                logger.error('Firestore Snapshot Error:', err);
                // If it's an index error, it usually contains a link
                setError('Unable to load history. If this is a new setup, a database index might be required. Check console for details.');
                setLoading(false);
            });

            return () => unsubscribe();
        } catch (err) {
            logger.error('Query Setup Error:', err);
            setError('Failed to initialize ticket history.');
            setLoading(false);
        }
    }, [currentUser?.uid]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!topic.trim() || !description.trim()) return;

        setSubmitting(true);
        try {
            await addDoc(collection(db, 'enquiries'), {
                userId: currentUser.uid,
                userEmail: currentUser.email,
                topic,
                description,
                status: 'pending',
                createdAt: serverTimestamp(),
                type: 'ticket'
            });
            setTopic('');
            setDescription('');
            setShowForm(false);
            setSelectedEnquiry(null);
        } catch (err) {
            logger.error('Error submitting enquiry:', err);
            setError('Failed to submit. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleContinueFromPreview = (enquiry) => {
        setTopic(`Re: ${enquiry.topic}`);
        setDescription('');
        setShowForm(true);
        setSelectedEnquiry(null);
    };

    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950 pb-32">
            {/* Header */}
            <header className="flex items-center justify-center p-6 bg-white dark:bg-slate-950 sticky top-14 z-10 border-b border-gray-100 dark:border-slate-800">
                <h1 className="text-[14px] font-[900] text-[#1a227f] dark:text-white tracking-[0.2em] uppercase">Support & Tickets</h1>
            </header>

            <div className="p-6 space-y-8">
                {/* Main Action Button */}
                {!showForm && !selectedEnquiry && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="w-full h-16 bg-[#1a227f] text-white rounded-[22px] font-black text-sm flex items-center justify-center gap-3 shadow-lg shadow-[#1a227f]/20 active:scale-95 transition-all"
                    >
                        <Plus size={20} />
                        Submit Ticket
                    </button>
                )}

                {/* Submit Form */}
                {showForm && (
                    <div className="bg-gray-50 dark:bg-slate-900 rounded-[30px] p-8 border border-gray-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-4">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-[#1a227f] dark:text-white">New Support Ticket</h2>
                            <button onClick={() => setShowForm(false)} className="p-2 text-gray-400">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Topic</label>
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="Enter subject..."
                                    className="w-full h-14 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl px-5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#1a227f]/10"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Message Details</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Write your message here..."
                                    className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#1a227f]/10 min-h-[150px]"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full h-14 bg-[#1a227f] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {submitting ? 'Sending Request...' : (
                                    <>
                                        <Send size={18} />
                                        Send Message
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                )}

                {/* History List */}
                {!showForm && !selectedEnquiry && (
                    <div className="space-y-5">
                        <h3 className="text-[11px] font-[900] uppercase tracking-[0.2em] text-gray-400 ml-1">Ticket History</h3>

                        {error && (
                            <div className="p-6 bg-red-50 text-red-600 rounded-3xl text-xs font-bold flex items-center gap-3">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <Skeleton key={i} className="h-28 w-full rounded-[28px]" />
                                ))}
                            </div>
                        ) : enquiries.length === 0 ? (
                            <div className="text-center py-20 bg-gray-50/50 dark:bg-slate-900/50 rounded-[40px] border border-dashed border-gray-200 dark:border-slate-800">
                                <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm text-gray-300">
                                    <MessageSquare size={36} />
                                </div>
                                <p className="text-sm font-black text-gray-400 tracking-tight">No active tickets found</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {enquiries.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setSelectedEnquiry(item)}
                                        className="w-full text-left bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[28px] p-6 shadow-sm hover:border-[#1a227f] transition-all group overflow-hidden relative"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${item.status === 'resolved' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                                                <h4 className="font-black text-[#1a227f] dark:text-white text-sm tracking-tight">{item.topic}</h4>
                                            </div>
                                            <ChevronRight size={16} className="text-gray-300 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-1 font-bold mb-4">
                                            {item.description}
                                        </p>
                                        <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-slate-800">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                {item.createdAt?.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                            <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-[0.1em] ${item.status === 'resolved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                {item.status || 'PENDING'}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Preview View */}
                {selectedEnquiry && (
                    <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
                        <div className="flex items-center gap-4 mb-8">
                            <button onClick={() => setSelectedEnquiry(null)} className="w-10 h-10 bg-gray-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-gray-500">
                                <ArrowLeft size={18} />
                            </button>
                            <h2 className="text-xl font-black text-[#1a227f] dark:text-white tracking-tight">Ticket Preview</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-gray-100 dark:border-slate-800 p-8 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${selectedEnquiry.status === 'resolved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                        {selectedEnquiry.status || 'PENDING'}
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-400">
                                        ID: {selectedEnquiry.id.slice(0, 8)}
                                    </span>
                                </div>

                                <h3 className="text-lg font-black text-[#1a227f] dark:text-white mb-4 leading-tight">{selectedEnquiry.topic}</h3>
                                <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed font-bold whitespace-pre-wrap mb-8">
                                    {selectedEnquiry.description}
                                </p>

                                {selectedEnquiry.adminReply && (
                                    <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-3xl p-6">
                                        <div className="flex items-center gap-2 mb-3 text-emerald-600">
                                            <MessageSquare size={16} />
                                            <span className="text-[11px] font-black uppercase tracking-widest">Official Response</span>
                                        </div>
                                        <p className="text-sm text-emerald-800 dark:text-emerald-400 font-bold leading-relaxed italic">
                                            "{selectedEnquiry.adminReply}"
                                        </p>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => handleContinueFromPreview(selectedEnquiry)}
                                className="w-full h-16 border-2 border-[#1a227f] text-[#1a227f] dark:text-white rounded-[24px] font-black text-sm flex items-center justify-center gap-3 hover:bg-[#1a227f] hover:text-white transition-all active:scale-95"
                            >
                                <Plus size={20} />
                                Continue Submit Ticket
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
