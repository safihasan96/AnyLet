export default function SearchAreaButton({ visible, onClick }) {
    if (!visible) return null;

    return (
        <button
            type="button"
            onClick={onClick}
            className="absolute left-1/2 top-4 z-[1000] -translate-x-1/2 rounded-full bg-primary px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-primary/20 transition-all active:scale-95 hover:scale-105 flex items-center gap-2"
        >
            <span className="text-lg">🔍</span>
            Search this area
        </button>
    );
}
