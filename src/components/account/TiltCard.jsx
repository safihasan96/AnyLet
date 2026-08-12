import { useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring, useReducedMotion } from 'framer-motion';

/**
 * TiltCard — a card with a subtle 3D hover tilt (spring-damped). Respects
 * reduced-motion. Used for the mobile profile card on the Account page.
 */
export default function TiltCard({ children, onClick, className, variants, style = {} }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const shouldReduce = useReducedMotion();

  const rotateX = useTransform(y, [-0.5, 0.5], [3, -3]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-5, 5]);
  const sRotateX = useSpring(rotateX, { stiffness: 400, damping: 30 });
  const sRotateY = useSpring(rotateY, { stiffness: 400, damping: 30 });

  function handleMouseMove(e) {
    if (shouldReduce) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }
  function handleMouseLeave() { x.set(0); y.set(0); }

  return (
    <motion.div
      ref={ref}
      variants={variants}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileTap={{ scale: 0.98 }}
      style={{
        rotateX: shouldReduce ? 0 : sRotateX,
        rotateY: shouldReduce ? 0 : sRotateY,
        perspective: 800,
        transformStyle: 'preserve-3d',
        willChange: 'transform',
        ...style
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
