import { useEffect } from 'react';

export default function Toast({ message, onClose }) {
    useEffect(() => {
        if (!message) return undefined;
        const timer = window.setTimeout(onClose, 3000);
        return () => window.clearTimeout(timer);
    }, [message, onClose]);

    if (!message) return null;

    return (
        <div className="fixed left-1/2 top-[calc(1rem+env(safe-area-inset-top))] z-[3000] w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 rounded-xl bg-[#111827] px-4 py-3 text-center text-sm font-semibold text-white shadow-lg">
            {message}
        </div>
    );
}
