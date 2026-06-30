import { useState, useEffect } from 'react';

/**
 * useMediaQuery — Reactive media query hook
 * SSR-safe (returns false during server render)
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    mql.addEventListener('change', onChange);
    setMatches(mql.matches);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

// ── Preset Convenience Hooks ──────────────────────────────────
export const useIsDesktop  = () => useMediaQuery('(min-width: 1024px)');
export const useIsTablet   = () => useMediaQuery('(min-width: 768px)');
export const useIsMobile   = () => useMediaQuery('(max-width: 767px)');
export const useIsWide     = () => useMediaQuery('(min-width: 1280px)');
export const useIsUltraWide = () => useMediaQuery('(min-width: 1536px)');
