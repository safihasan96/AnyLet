import { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import Modal3D from './Modal3D';

export default function ShareModal({ isOpen, onClose, property }) {
    const [copied, setCopied] = useState(false);

    if (!property) return null;

    const shareUrl = `${window.location.origin}/property/${property.id}`;
    const textToShare = `Check out this listing on Any-Let: ${property.title} (৳${property.rent?.toLocaleString()}/${property.billingCycle})`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(textToShare + '\n' + shareUrl)}`;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    const firstImage = property.images?.[0] || '';

    return (
        <Modal3D isOpen={isOpen} onClose={onClose} className="max-w-md" zIndex={200}>
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-100 dark:border-slate-800">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white">Share Listing</h2>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                            Spread the word about this property
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-100 dark:border-slate-700"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Property Preview Card */}
                    <div className="flex gap-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/80">
                        {firstImage ? (
                            <img
                                src={firstImage}
                                alt={property.title}
                                className="w-20 h-20 rounded-xl object-cover shrink-0 border border-slate-200/50 dark:border-slate-700/50"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] text-slate-400 font-bold shrink-0">
                                No Image
                            </div>
                        )}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <h4 className="text-sm font-black text-slate-900 dark:text-white truncate mb-1">
                                {property.title}
                            </h4>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate mb-2">
                                {property.upazila}, {property.district}
                            </p>
                            <div className="text-xs font-black text-primary">
                                ৳{property.rent?.toLocaleString()} <span className="text-slate-400 font-medium">/{property.billingCycle}</span>
                            </div>
                        </div>
                    </div>

                    {/* Copy Link Section */}
                    <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 ml-1">
                            Property Link
                        </label>
                        <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all overflow-hidden">
                            <input
                                type="text"
                                readOnly
                                value={shareUrl}
                                onClick={(e) => e.target.select()}
                                className="w-full bg-transparent border-none focus:ring-0 text-sm text-slate-700 dark:text-slate-300 font-medium px-2 truncate"
                            />
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleCopy}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-black text-xs transition-colors shrink-0 ${
                                    copied ? 'bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20' : 'bg-primary hover:bg-[#2d1e6b] shadow-lg shadow-primary/20'
                                }`}
                            >
                                {copied ? (
                                    <>
                                        <Check size={14} />
                                        <span>Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy size={14} />
                                        <span>Copy</span>
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </div>

                    {/* Sharing Buttons Grid */}
                    <div className="space-y-3">
                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 ml-1">
                            Share directly to
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            {/* WhatsApp Button */}
                            <motion.a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                whileHover={{ y: -3, scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center justify-center gap-2.5 py-4 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-black text-sm shadow-xl shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all border border-emerald-400/20"
                            >
                                <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.66.986 3.284 1.488 4.966 1.49 5.485.002 9.957-4.469 9.96-9.956.002-2.657-1.019-5.155-2.877-7.015-1.858-1.859-4.329-2.883-6.99-2.885-5.489 0-9.96 4.47-9.963 9.957-.001 1.8.49 3.5 1.42 4.975l-.997 3.646 3.781-.992zm11.376-7.8c-.282-.141-1.666-.822-1.923-.916-.258-.094-.446-.141-.634.141-.188.281-.727.916-.892 1.104-.164.188-.328.211-.61.07-2.8-.14-3.856-1.054-4.887-1.954-.266-.232-.511-.478-.71-.726-.282-.486-.031-.75.21-.99.217-.216.48-.562.72-.843.082-.096.162-.193.237-.289.176-.328.094-.61-.047-.89-.14-.282-.634-1.528-.868-2.09-.228-.547-.479-.473-.657-.482-.17-.008-.364-.01-.559-.01-.195 0-.514.073-.784.37-.27.296-1.031 1.008-1.031 2.46s1.057 2.858 1.203 3.056c.146.197 2.08 3.176 5.038 4.451.704.303 1.254.484 1.683.62.707.225 1.352.193 1.86.117.567-.084 1.666-.68 1.902-1.336.236-.656.236-1.219.165-1.336-.07-.117-.258-.188-.54-.33z" />
                                </svg>
                                <span>WhatsApp</span>
                            </motion.a>

                            {/* Facebook Button */}
                            <motion.a
                                href={facebookUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                whileHover={{ y: -3, scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center justify-center gap-2.5 py-4 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-sm shadow-xl shadow-blue-600/10 hover:shadow-blue-600/20 transition-all border border-blue-500/20"
                            >
                                <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                                <span>Facebook</span>
                            </motion.a>
                        </div>
                    </div>
                </div>
            </div>
        </Modal3D>
    );
}
