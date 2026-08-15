import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * cn — merge conditional class lists and resolve Tailwind conflicts.
 * Consumer `className` passed last always wins (e.g. override `rounded-card`
 * with `rounded-none`). This is the single class-composition helper for the
 * design system; every primitive uses it.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default cn;
