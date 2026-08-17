import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Z } from '../../lib/tokens';
import { Icon } from '../../lib/icons';
import IconButton from '../ui/IconButton';
import { useScrollLock } from '../ui/overlayUtils';

/**
 * Lightbox — controlled fullscreen photo viewer (the Phase 0 gallery lightbox,
 * extracted so any surface can trigger it). Materializes in (scale + fade),
 * arrow-key / on-screen navigation, Esc to close, scroll-locked, focus returns
 * to the trigger. Reduced motion → cross-fade only.
 *
 *   <Lightbox open={o} images={pics} index={i} onIndexChange={setI} onClose={close} />
 */
export default function Lightbox({ open, images = [], index = 0, onIndexChange, onClose, alt = 'Photo' }) {
  const reduce = useReducedMotion();
  const [dir, setDir] = useState(0);
  const closeRef = useRef(null);
  const restoreRef = useRef(null);
  const count = images.length;

  useScrollLock(open);

  const go = (d) => { setDir(d); onIndexChange?.((index + d + count) % count); };

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement;
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (restoreRef.current?.focus) restoreRef.current.focus({ preventScroll: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index, count]);

  if (typeof document === 'undefined') return null;

  const variants = {
    enter: (d) => (reduce ? { opacity: 0 } : { opacity: 0, x: d > 0 ? 60 : -60 }),
    center: { opacity: 1, x: 0 },
    exit: (d) => (reduce ? { opacity: 0 } : { opacity: 0, x: d > 0 ? -60 : 60 }),
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          className="fixed inset-0 flex flex-col bg-black/95"
          style={{ zIndex: Z.modal }}
          initial={reduce ? { opacity: 0 } : { opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <div className="flex items-center justify-between px-4 py-4 text-white" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
            <span className="rounded-pill bg-white/10 px-3 py-1 text-caption font-medium">{count ? index + 1 : 0} / {count}</span>
            <IconButton ref={closeRef} label="Close viewer" variant="ghost" onClick={onClose} className="text-white hover:bg-white/10"><Icon name="close" /></IconButton>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-8">
            <AnimatePresence initial={false} custom={dir} mode="popLayout">
              <motion.img
                key={index}
                src={images[index]}
                alt={`${alt} ${index + 1} of ${count}`}
                custom={dir}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
                className="max-h-full max-w-full object-contain"
                draggable={false}
              />
            </AnimatePresence>

            {count > 1 && (
              <>
                <IconButton label="Previous photo" variant="surface" shape="pill" size="lg" onClick={() => go(-1)} className="absolute left-4 top-1/2 -translate-y-1/2"><Icon name="chevronLeft" /></IconButton>
                <IconButton label="Next photo" variant="surface" shape="pill" size="lg" onClick={() => go(1)} className="absolute right-4 top-1/2 -translate-y-1/2"><Icon name="chevronRight" /></IconButton>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
