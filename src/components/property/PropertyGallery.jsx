import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getOptimizedImageUrl } from '../../utils/imageUtils';

const sliderVariants = {
    enter: (direction) => ({
        x: direction > 0 ? 1000 : -1000,
        opacity: 0
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1
    },
    exit: (direction) => ({
        zIndex: 0,
        x: direction < 0 ? 1000 : -1000,
        opacity: 0
    })
};

/**
 * PropertyGallery — swipeable image carousel with pagination dots and a mobile
 * share button. Owns its own carousel state; `onShare` comes from the shell.
 */
export default function PropertyGallery({ images = [], onShare }) {
    const [activeImage, setActiveImage] = useState(0);
    const [slideDirection, setSlideDirection] = useState(0);

    const paginateImage = (newDirection) => {
        setSlideDirection(newDirection);
        setActiveImage((prev) => {
            const next = prev + newDirection;
            if (next >= images.length) return 0;
            if (next < 0) return images.length - 1;
            return next;
        });
    };

    return (
        <div className="relative md:rounded-[40px] overflow-hidden bg-slate-200 dark:bg-slate-900 group shadow-2xl shadow-slate-200/50 dark:shadow-none mb-6 md:mb-10">
            {/* Mobile Share Overlay */}
            <button
                onClick={onShare}
                className="md:hidden absolute top-4 right-4 z-10 flex items-center justify-center size-10 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-lg border border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 active:scale-90 transition-transform"
                aria-label="Share property"
            >
                <Share2 size={18} />
            </button>

            {images.length > 0 ? (
                <>
                    <div className="w-full aspect-[4/3] relative overflow-hidden cursor-grab active:cursor-grabbing">
                        <AnimatePresence initial={false} custom={slideDirection}>
                            <motion.img
                                key={activeImage}
                                custom={slideDirection}
                                variants={sliderVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                                src={getOptimizedImageUrl(images[activeImage], 1200)}
                                className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                                draggable={false}
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={1}
                                onDragEnd={(e, { offset, velocity }) => {
                                    const swipe = Math.abs(offset.x) * velocity.x;
                                    if (swipe < -10000) {
                                        paginateImage(1);
                                    } else if (swipe > 10000) {
                                        paginateImage(-1);
                                    } else if (offset.x < -100) {
                                        paginateImage(1);
                                    } else if (offset.x > 100) {
                                        paginateImage(-1);
                                    }
                                }}
                            />
                        </AnimatePresence>

                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={() => paginateImage(-1)}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 size-12 rounded-full bg-white/70 backdrop-blur-md text-slate-800 flex items-center justify-center shadow-lg hover:bg-white transition-all opacity-0 group-hover:opacity-100 hidden md:flex z-10"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <button
                                    onClick={() => paginateImage(1)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 size-12 rounded-full bg-white/70 backdrop-blur-md text-slate-800 flex items-center justify-center shadow-lg hover:bg-white transition-all opacity-0 group-hover:opacity-100 hidden md:flex z-10"
                                >
                                    <ChevronRight size={24} />
                                </button>
                            </>
                        )}
                    </div>
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 px-4 py-3 bg-black/20 backdrop-blur-md rounded-full border border-white/20 z-20">
                        {images.map((_, idx) => (
                            <motion.button
                                key={idx}
                                layoutId={`dot-${idx}`}
                                onClick={() => {
                                    setSlideDirection(idx > activeImage ? 1 : -1);
                                    setActiveImage(idx);
                                }}
                                animate={{ width: activeImage === idx ? 24 : 10, background: activeImage === idx ? 'var(--color-primary, #6366f1)' : 'rgba(255,255,255,0.6)' }}
                                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                                className="h-2.5 rounded-full"
                            />
                        ))}
                    </div>
                </>
            ) : (
                <div className="aspect-[4/3] flex items-center justify-center text-slate-400">No Image Available</div>
            )}
        </div>
    );
}
