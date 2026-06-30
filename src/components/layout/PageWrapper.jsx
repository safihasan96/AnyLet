import { motion } from 'framer-motion';
import { pageTransition } from '../../lib/motion';
import { useIsDesktop } from '../../hooks/useMediaQuery';

export default function PageWrapper({ children, className = '' }) {
  const isDesktop = useIsDesktop();

  if (!isDesktop) {
    // On mobile: no animation wrapper — pure passthrough
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={pageTransition}
      initial="hidden"
      animate="enter"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}
