import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/cn';
import { Z } from '../../lib/tokens';
import { Icon } from '../../lib/icons';
import IconButton from '../ui/IconButton';
import { useScrollLock } from '../ui/overlayUtils';

/**
 * ImageGallery (pattern) — main viewer + thumbnail strip + fullscreen lightbox.
 * Left/right arrows navigate; Esc closes the lightbox. Slide direction is
 * preserved (spatial consistency); reduced motion → cross-fade. Every control
 * is labelled and keyboard reachable.
 */
export default function ImageGallery({ images = [], alt = 'Property photo', className }) {
  const pics = images.filter(Boolean);
  const [[idx, dir], setState] = useState([0, 0]);
  const [lightbox, setLightbox] = useState(false);
  const reduce = useReducedMotion();
  useScrollLock(lightbox);

  const go = useCallback((next, d) => setState([(next + pics.length) % pics.length, d]), [pics.length]);
  const prev = useCallback(() => go(idx - 1, -1), [go, idx]);
  const next = useCallback(() => go(idx + 1, 1), [go, idx]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'Escape') setLightbox(false);
    };
    if (lightbox) {
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }
  }, [lightbox, prev, next]);

  if (!pics.length) {
    return (
      <div className={cn('grid aspect-[4/3] w-full place-items-center rounded-card-lg bg-surface-sunken text-subtle', className)}>
        <Icon name="imageOff" className="size-10" />
      </div>
    );
  }

  const variants = {
    enter: (d) => (reduce ? { opacity: 0 } : { opacity: 0, x: d > 0 ? 40 : -40 }),
    center: { opacity: 1, x: 0 },
    exit: (d) => (reduce ? { opacity: 0 } : { opacity: 0, x: d > 0 ? -40 : 40 }),
  };

  // Plain render helper (not a component) so it doesn't remount on each render.
  const renderViewer = (inLightbox) => (
    <div className={cn('relative overflow-hidden', inLightbox ? 'h-full w-full' : 'aspect-[4/3] w-full rounded-card-lg bg-surface-sunken')}>
      <AnimatePresence initial={false} custom={dir} mode="popLayout">
        <motion.img
          key={idx}
          src={pics[idx]}
          alt={`${alt} ${idx + 1} of ${pics.length}`}
          custom={dir}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
          className={cn('absolute inset-0 size-full', inLightbox ? 'object-contain' : 'object-cover')}
        />
      </AnimatePresence>

      {pics.length > 1 && (
        <>
          <IconButton label="Previous photo" variant="surface" shape="pill" onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2"><Icon name="chevronLeft" /></IconButton>
          <IconButton label="Next photo" variant="surface" shape="pill" onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2"><Icon name="chevronRight" /></IconButton>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-pill bg-black/55 px-2.5 py-1 text-caption font-medium text-white backdrop-blur-sm">
            {idx + 1} / {pics.length}
          </div>
        </>
      )}
      {!inLightbox && (
        <IconButton label="View fullscreen" variant="surface" shape="pill" onClick={() => setLightbox(true)}
          className="absolute right-3 top-3"><Icon name="expand" /></IconButton>
      )}
    </div>
  );

  return (
    <div className={className}>
      {renderViewer(false)}

      {pics.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {pics.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i, i > idx ? 1 : -1)}
              aria-label={`View photo ${i + 1}`}
              aria-current={i === idx}
              className={cn(
                'relative size-16 shrink-0 overflow-hidden rounded-control transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                i === idx ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface' : 'opacity-70 hover:opacity-100'
              )}
            >
              <img src={src} alt="" className="size-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {lightbox && (
              <motion.div
                className="fixed inset-0 flex flex-col bg-black/92"
                style={{ zIndex: Z.modal }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                role="dialog" aria-modal="true" aria-label="Photo viewer"
              >
                <div className="flex justify-end p-4">
                  <IconButton label="Close viewer" variant="ghost" onClick={() => setLightbox(false)} className="text-white hover:bg-white/10"><Icon name="close" /></IconButton>
                </div>
                <div className="relative flex-1 min-h-0 px-4 pb-8">{renderViewer(true)}</div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
