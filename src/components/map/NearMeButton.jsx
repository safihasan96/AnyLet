import { MapPin } from 'lucide-react';
import { useMap } from 'react-leaflet';

export default function NearMeButton({ showToast }) {
    const map = useMap();

    const handleClick = () => {
        if (!navigator.geolocation) {
            showToast('Location is not supported on this device');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                const isInsideBangladesh =
                    latitude >= 20.37 &&
                    latitude <= 26.64 &&
                    longitude >= 88.0 &&
                    longitude <= 92.68;

                if (isInsideBangladesh) {
                    map.flyTo([latitude, longitude], 14, { animate: true, duration: 1.2 });
                } else {
                    showToast('Your location is outside Bangladesh');
                }
            },
            () => showToast('Location access denied')
        );
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className="absolute bottom-[calc(18rem+max(env(safe-area-inset-bottom),0.75rem))] right-4 z-[999] flex h-11 min-w-11 items-center justify-center gap-2 rounded-full bg-white px-0 text-[#1B4332] shadow-lg md:bottom-6 md:px-4"
            aria-label="Near Me"
        >
            <MapPin size={18} strokeWidth={2.5} />
            <span className="hidden text-sm font-semibold md:inline">Near Me</span>
        </button>
    );
}
