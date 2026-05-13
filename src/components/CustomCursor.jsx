import { useEffect, useRef } from 'react';

export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    const isTouchDevice =
      window.matchMedia('(max-width: 768px)').matches ||
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0;

    if (isTouchDevice) return;

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

    let mx = -1000, my = -1000;
    let rx = -1000, ry = -1000;
    let rafId;
    let isHovering = false;
    let isClicking = false;
    let lastScrollY = window.scrollY;

    const onMouseMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
    };

    const onMouseLeave = () => {
      mx = -1000;
      my = -1000;
    };

    const onMouseEnter = (e) => {
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
      const currentScrollY = window.scrollY;
      const deltaY = currentScrollY - lastScrollY;
      lastScrollY = currentScrollY;

      dot.style.transform = `translate(${mx - 4}px, ${my - 4}px)`;
      ry -= deltaY;

      const speed = isHovering ? 0.14 : 0.18;
      rx = lerp(rx, mx, speed);
      ry = lerp(ry, my, speed);

      const scale = isClicking ? 0.75 : isHovering ? 1.35 : 1;
      ring.style.transform = `translate(${rx - 14}px, ${ry - 14}px) scale(${scale})`;
      
      if (mx < 0 || my < 0 || mx > window.innerWidth || my > window.innerHeight) {
        dot.style.visibility = 'hidden';
        ring.style.visibility = 'hidden';
      } else {
        dot.style.visibility = 'visible';
        ring.style.visibility = 'visible';
        ring.style.opacity = isHovering ? '0.7' : '0.45';
      }
      
      ring.style.borderColor = isHovering ? 'rgba(26,34,127,0.8)' : 'rgba(26,34,127,0.5)';
      ring.style.backgroundColor = isHovering ? 'rgba(26,34,127,0.08)' : 'transparent';

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseover', onMouseOver, { passive: true });
    window.addEventListener('mousedown', onMouseDown, { passive: true });
    window.addEventListener('mouseup',   onMouseUp,   { passive: true });
    window.addEventListener('blur', onMouseLeave);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseover', onMouseOver);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup',   onMouseUp);
      window.removeEventListener('blur', onMouseLeave);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      document.head.removeChild(style);
    };
  }, []);

  return (
    <>
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
          visibility: 'hidden',
        }}
      />
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
          transition: 'background-color 0.2s, border-color 0.2s',
          visibility: 'hidden',
        }}
      />
    </>
  );
}
