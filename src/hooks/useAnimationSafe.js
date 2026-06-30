import { useIsDesktop, useMediaQuery } from './useMediaQuery';

export function useAnimationSafe() {
  const isDesktop = useIsDesktop();
  const prefersReduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  return isDesktop && !prefersReduced;
}
