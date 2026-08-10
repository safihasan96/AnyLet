import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * cn — merge conditional class names and resolve conflicting Tailwind utilities.
 *
 * clsx handles conditional/array/object inputs; twMerge ensures that when two
 * conflicting Tailwind classes are present (e.g. `p-2` and `p-4`), the last one
 * wins instead of both being emitted.
 *
 * @example
 *   cn('px-4 py-2', isActive && 'bg-primary', className)
 *   cn('p-2', 'p-4') // → 'p-4'
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default cn;
