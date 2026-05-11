import { useEffect, useRef } from 'react';

export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    // Don't run on touch/mobile devices
    const isTouchDevice =
      window.matchMedia('(max-width: 768px)').matches ||
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0;

    if (isTouchDevice) return;

    // Hide native cursor via stylesheet
    const style = document.createElement('style');
    style.id = 'custom-cursor-style';
    style.textContent = `
      @media (pointer: fine) {
        *, *::before, *::after { cursor: none !important; }
        input, textarea, select { cursor: text !important; }
      }
    `;
    document.head.appendChild(style);

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // Current real mouse position
    let mx = -100, my = -100;
    // Ring position (lags slightly for smooth follow feel)
    let rx = -100, ry = -100;
    let rafId;
    let isHovering = false;
    let isClicking = false;
    let lastScrollY = window.scrollY;

    const onMouseMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
    };

    const onMouseOver = (e) => {
      const el = e.target;
      isHovering =
        el.tagName === 'A' ||
        el.tagName === 'BUTTON' ||
        el.closest('a') !== null ||
        el.closest('button') !== null ||
        el.classList.contains('cursor-pointer') ||
        window.getComputedStyle(el).cursor === 'pointer';
    };

    const onMouseDown = () => { isClicking = true; };
    const onMouseUp   = () => { isClicking = false; };

    const lerp = (a, b, t) => a + (b - a) * t;

    const tick = () => {
      // Calculate scroll delta to create a scroll momentum effect on the ring
      const currentScrollY = window.scrollY;
      const deltaY = currentScrollY - lastScrollY;
      lastScrollY = currentScrollY;

      // Dot follows instantly (no lag)
      dot.style.transform = `translate(${mx - 4}px, ${my - 4}px)`;

      // Apply scroll delta to the ring's current position so it gets "dragged" by the page
      ry -= deltaY;

      // Ring lerps toward mouse — tweak 0.18 for more/less lag
      const speed = isHovering ? 0.14 : 0.18;
      rx = lerp(rx, mx, speed);
      ry = lerp(ry, my, speed);

      // Reduced hover scale from 1.6 to 1.35
      const scale = isClicking ? 0.75 : isHovering ? 1.35 : 1;
      
      // Using 28px base size requires a 14px offset
      ring.style.transform = `translate(${rx - 14}px, ${ry - 14}px) scale(${scale})`;
      ring.style.opacity = isHovering ? '0.7' : '0.45';
      ring.style.borderColor = isHovering ? 'rgba(26,34,127,0.8)' : 'rgba(26,34,127,0.5)';
      ring.style.backgroundColor = isHovering ? 'rgba(26,34,127,0.08)' : 'transparent';

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseover', onMouseOver, { passive: true });
    window.addEventListener('mousedown', onMouseDown, { passive: true });
    window.addEventListener('mouseup',   onMouseUp,   { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseover', onMouseOver);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup',   onMouseUp);
      document.head.removeChild(style);
    };
  }, []);

  return (
    <>
      {/* Dot — instant, no lag */}
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          top: 0, left: 0,
          width: 8, height: 8,
          borderRadius: '50%',
          backgroundColor: '#1a227f',
          pointerEvents: 'none',
          zIndex: 999999,
          willChange: 'transform',
        }}
      />
      {/* Ring — slight smooth follow */}
      <div
        ref={ringRef}
        style={{
          position: 'fixed',
          top: 0, left: 0,
          width: 28, height: 28,
          borderRadius: '50%',
          border: '1.5px solid rgba(26,34,127,0.5)',
          pointerEvents: 'none',
          zIndex: 999998,
          willChange: 'transform',
          transition: 'background-color 0.2s, border-color 0.2s, opacity 0.2s',
        }}
      />
    </>
  );
}
