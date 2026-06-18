import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ArrowLeft, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import logger from '../utils/logger';

const REPORT_REASONS = [
    "Misleading or incorrect information",
    "Inappropriate or offensive content",
    "Spam or duplicate listing",
    "Misleading price or hidden costs",
    "Property no longer available",
    "Landlord/Agent seems fraudulent",
    "Other"
];

export default function ReportProperty() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();
    const toast = useToast();
    const [property, setProperty] = useState(location.state?.property || null);
    const [loading, setLoading] = useState(!property);
    const [reason, setReason] = useState('');
    const [details, setDetails] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (!property) {
            const fetchProperty = async () => {
                try {
                    const docSnap = await getDoc(doc(db, 'properties', id));
                    if (docSnap.exists()) {
                        setProperty({ id: docSnap.id, ...docSnap.data() });
                    }
                } catch (error) {
                    logger.error("Error fetching property:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchProperty();
        }
    }, [id, property]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason) return toast.warning("Please select a reason for reporting.");
        if (reason === 'Other' && !details.trim()) return toast.warning("Please provide details for your report.");
        if (!currentUser) return navigate('/login');

        try {
            setSubmitting(true);
            await addDoc(collection(db, 'reports'), {
                propertyId: id,
                propertyTitle: property?.title || 'Unknown Property',
                propertyOwnerId: property?.ownerId || property?.userId || 'Unknown',
                reporterId: currentUser.uid,
                reporterName: currentUser.displayName || 'Anonymous User',
                reporterEmail: currentUser.email,
                reason,
                details,
                status: 'pending',
                createdAt: serverTimestamp()
            });
            setSubmitted(true);
        } catch (error) {
            logger.error("Error submitting report:", error);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
            <div className="animate-pulse flex flex-col items-center">
                <div className="size-12 bg-primary/20 rounded-full mb-4"></div>
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
            </div>
        </div>
    );

    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-white dark:bg-slate-900 p-10 rounded-[40px] shadow-xl text-center border border-slate-100 dark:border-slate-800"
                >
                    <div className="size-20 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-6">
                        <CheckCircle2 size={48} />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-4">Report Submitted</h1>
                    <p className="text-slate-600 dark:text-slate-400 font-medium mb-8">
                        Thank you for helping us keep Any-Let safe. Our team will review your report and take appropriate action.
                    </p>
                    <button 
                        onClick={() => navigate(`/property/${id}`)}
                        className="w-full py-4 bg-primary text-white rounded-2xl font-black text-lg shadow-lg shadow-primary/20 transition-transform active:scale-95"
                    >
                        Back to Property
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 md:px-6">
            <div className="max-w-2xl mx-auto">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-primary dark:text-indigo-400 transition-colors mb-8 font-bold">
                    <ArrowLeft size={20} /> Back
                </button>

                <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 md:p-12 shadow-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="size-14 bg-rose-100 dark:bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500">
                            <ShieldAlert size={32} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Report Listing</h1>
                            <p className="text-slate-500 font-bold text-sm">Property: {property?.title}</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Reason for Reporting</label>
                            <div className="grid grid-cols-1 gap-3">
                                {REPORT_REASONS.map((r) => (
                                    <label 
                                        key={r}
                                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${reason === r ? 'border-primary bg-primary/5 text-primary dark:text-indigo-400' : 'border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-200'}`}
                                    >
                                        <input 
                                            type="radio" 
                                            name="reason" 
                                            value={r} 
                                            checked={reason === r}
                                            onChange={(e) => setReason(e.target.value)}
                                            className="hidden"
                                        />
                                        <div className={`size-5 rounded-full border-2 flex items-center justify-center ${reason === r ? 'border-primary bg-primary' : 'border-slate-300'}`}>
                                            {reason === r && <div className="size-2 bg-white rounded-full"></div>}
                                        </div>
                                        <span className="font-bold">{r}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Additional Details (Optional)</label>
                            <textarea 
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-primary/20 rounded-3xl p-6 font-bold text-slate-900 dark:text-white outline-none transition-all min-h-[150px]"
                                placeholder="Please provide more information about why you are reporting this ad..."
                            ></textarea>
                        </div>

                        <div className="pt-4">
                            <button 
                                type="submit"
                                disabled={submitting || !reason}
                                className="w-full py-5 bg-rose-500 text-white rounded-2xl font-black text-xl shadow-xl shadow-rose-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
                            >
                                {submitting ? 'Submitting Report...' : 'Submit Report'}
                            </button>
                            <p className="text-center text-xs text-slate-400 font-bold mt-6 flex items-center justify-center gap-2">
                                <AlertTriangle size={14} /> Serious misuse of reporting may result in account suspension.
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
