import { useState, useRef, useLayoutEffect } from 'react';
import { cn } from '../../lib/cn';
import { Icon } from '../../lib/icons';

/**
 * ExpandableText — clamps long copy to `lines` and reveals the rest with a
 * "Read more" toggle. The toggle only appears when the content actually
 * overflows. Animates height via a max-height transition (motion-safe).
 */
export default function ExpandableText({ children, lines = 5, className }) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (el) setOverflows(el.scrollHeight > el.clientHeight + 4);
  }, [children, lines]);

  return (
    <div className={className}>
      <div
        ref={ref}
        className={cn('whitespace-pre-wrap text-body leading-relaxed text-muted', !expanded && 'overflow-hidden')}
        style={!expanded ? { display: '-webkit-box', WebkitLineClamp: lines, WebkitBoxOrient: 'vertical' } : undefined}
      >
        {children}
      </div>
      {(overflows || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 inline-flex items-center gap-1 text-body-sm font-semibold text-primary transition-colors hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded-xs"
          aria-expanded={expanded}
        >
          {expanded ? 'Read less' : 'Read more'}
          <Icon name={expanded ? 'chevronUp' : 'chevronDown'} className="size-4" />
        </button>
      )}
    </div>
  );
}
