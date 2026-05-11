import Modal3D from './Modal3D';

const ConfirmationModal = ({
    isOpen,
    title,
    message,
    confirmText = 'Proceed',
    confirmColor = '#ef4444',
    onConfirm,
    onCancel,
    isSuccess = false,
    isLoading = false
}) => {
    return (
        <Modal3D isOpen={isOpen} onClose={(!isSuccess && !isLoading) ? onCancel : undefined} className="max-w-sm" zIndex={200}>
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden">
                {isSuccess ? (
                    <div className="flex flex-col items-center p-10">
                        {/* Success checkmark */}
                        <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20">
                            <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400">Success!</h3>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="px-6 pt-6 pb-3">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">{title}</h3>
                        </div>

                        {/* Body */}
                        <div className="px-6 pb-6">
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{message}</p>
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 px-6 pb-6">
                            <button
                                onClick={onCancel}
                                disabled={isLoading}
                                className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={isLoading}
                                className="flex-1 py-3 px-4 rounded-2xl text-white font-bold text-sm transition-opacity disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg"
                                style={{ backgroundColor: confirmColor }}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        Processing...
                                    </>
                                ) : confirmText}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </Modal3D>
    );
};

export default ConfirmationModal;
