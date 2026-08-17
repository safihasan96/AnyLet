import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/cn';
import { Icon } from '../../lib/icons';
import { Button, IconButton, Card } from '../ui';
import Lightbox from '../patterns/Lightbox';

/**
 * PropertyGallery — the marquee hero media.
 *  • Desktop: a flagship 5-image asymmetric grid (1 large + 4 stacked) with a
 *    gentle hover zoom and a floating "View all N photos" button.
 *  • Mobile: a high-aspect single-image carousel with dot + counter indicators.
 * Any tile / the button opens the Phase 0 fullscreen Lightbox at that index.
 */
function Tile({ src, alt, onClick, className }) {
  // Card rendered as an accessible button element (focus-visible ring, keyboard)
  // — the clickable image tile, composed from the primitive with no raw markup.
  return (
    <Card
      as="button"
      type="button"
      variant="sunken"
      padding="none"
      onClick={onClick}
      aria-label={alt}
      className={cn('group/tile relative block overflow-hidden rounded-none border-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring', className)}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="size-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.2,0,0,1)] motion-safe:group-hover/tile:scale-[1.04]"
      />
      <span className="absolute inset-0 bg-black/0 transition-colors group-hover/tile:bg-black/5" />
    </Card>
  );
}

export default function PropertyGallery({ images = [], alt = 'Property photo', className }) {
  const pics = images.filter(Boolean);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [mobile, setMobile] = useState([0, 0]); // [idx, dir]
  const reduce = useReducedMotion();

  const launch = (i) => { setIndex(i); setOpen(true); };

  if (!pics.length) {
    return (
      <div className={cn('grid aspect-[16/10] w-full place-items-center rounded-2xl bg-surface-sunken text-subtle', className)}>
        <Icon name="imageOff" className="size-12" />
      </div>
    );
  }

  const [mIdx, mDir] = mobile;
  const paginate = (d) => setMobile([(mIdx + d + pics.length) % pics.length, d]);
  const mVariants = {
    enter: (d) => (reduce ? { opacity: 0 } : { opacity: 0, x: d > 0 ? 80 : -80 }),
    center: { opacity: 1, x: 0 },
    exit: (d) => (reduce ? { opacity: 0 } : { opacity: 0, x: d > 0 ? -80 : 80 }),
  };

  const main = pics[0];
  const secondary = pics.slice(1, 5);
  const viewAll = (
    <Button
      variant="secondary" size="sm"
      leftIcon={<Icon name="image" />}
      onClick={() => launch(0)}
      className="absolute bottom-3 right-3 shadow-overlay"
    >
      View all {pics.length} photos
    </Button>
  );

  return (
    <div className={className}>
      {/* ── Desktop grid ─────────────────────────────────────────────── */}
      <div className="relative hidden md:block">
        {pics.length === 1 ? (
          <Tile src={main} alt={`${alt} 1`} onClick={() => launch(0)} className="aspect-[16/9] w-full rounded-2xl" />
        ) : (
          <div className="grid aspect-[16/9] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl">
            <Tile src={main} alt={`${alt} 1`} onClick={() => launch(0)}
              className={cn('col-span-2 row-span-2', secondary.length < 2 && 'col-span-3')} />
            {secondary.map((src, i) => (
              <Tile key={i} src={src} alt={`${alt} ${i + 2}`} onClick={() => launch(i + 1)}
                className={cn('col-span-1 row-span-1', secondary.length === 1 && 'col-span-1 row-span-2', secondary.length === 3 && i === 2 && 'col-span-2')} />
            ))}
          </div>
        )}
        {pics.length > 1 && viewAll}
      </div>

      {/* ── Mobile carousel ──────────────────────────────────────────── */}
      <div className="relative md:hidden">
        <div
          className="relative aspect-[4/3] w-full overflow-hidden rounded-card-lg bg-surface-sunken"
          onClick={() => launch(mIdx)}
        >
          <AnimatePresence initial={false} custom={mDir} mode="popLayout">
            <motion.img
              key={mIdx}
              src={pics[mIdx]}
              alt={`${alt} ${mIdx + 1} of ${pics.length}`}
              custom={mDir}
              variants={mVariants}
              initial="enter" animate="center" exit="exit"
              transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
              drag={pics.length > 1 ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = Math.abs(offset.x) * velocity.x;
                if (swipe < -8000 || offset.x < -80) paginate(1);
                else if (swipe > 8000 || offset.x > 80) paginate(-1);
              }}
              className="absolute inset-0 size-full object-cover"
              draggable={false}
            />
          </AnimatePresence>
          {pics.length > 1 && (
            <span className="absolute right-3 top-3 rounded-pill bg-black/55 px-2.5 py-1 text-caption font-medium text-white backdrop-blur-sm">
              {mIdx + 1} / {pics.length}
            </span>
          )}
        </div>
        {pics.length > 1 && (
          <div className="mt-3 flex items-center justify-between">
            <div className="flex gap-1.5" aria-hidden="true">
              {pics.slice(0, 8).map((_, i) => (
                <span key={i} className={cn('h-1.5 rounded-full bg-border-strong transition-all', i === mIdx ? 'w-4 bg-primary' : 'w-1.5')} />
              ))}
            </div>
            <IconButton label={`View all ${pics.length} photos`} variant="surface" size="sm" onClick={() => launch(mIdx)}><Icon name="image" /></IconButton>
          </div>
        )}
      </div>

      <Lightbox open={open} images={pics} index={index} onIndexChange={setIndex} onClose={() => setOpen(false)} alt={alt} />
    </div>
  );
}
