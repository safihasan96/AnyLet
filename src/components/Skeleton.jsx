/*
 * ─────────────────────────────────────────────────────────────
 *  Skeleton.jsx  –  Shimmer skeleton loading system
 *  Used as loading states across the whole website (not admin).
 * ─────────────────────────────────────────────────────────────
 */

/* Base shimmer block — combine for any layout */
export function Skeleton({ className = '' }) {
  return (
    <div
      className={`relative overflow-hidden bg-slate-200 dark:bg-slate-800 rounded-xl ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent" />
    </div>
  );
}

/* ── Keyframe injected once into <head> ── */
if (typeof document !== 'undefined') {
  const id = 'skeleton-keyframes';
  if (!document.getElementById(id)) {
    const s = document.createElement('style');
    s.id = id;
    s.textContent = `
      @keyframes shimmer {
        100% { transform: translateX(100%); }
      }
    `;
    document.head.appendChild(s);
  }
}

/* ──────────────────────────────────────────────────────────
   PROPERTY CARD SKELETON  (used in grids / search results)
────────────────────────────────────────────────────────── */
export function PropertyCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-[24px] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
      <Skeleton className="w-full aspect-[4/3] rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-4 w-16 rounded-full" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
        <div className="flex justify-between items-center pt-1">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   PROPERTY DETAILS SKELETON
────────────────────────────────────────────────────────── */
export function PropertyDetailSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32 lg:pb-12">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8">
        {/* Back row */}
        <Skeleton className="h-8 w-24 mb-6" />
        <div className="flex flex-col lg:flex-row gap-6 md:gap-10">
          {/* Left */}
          <div className="flex-1 lg:max-w-[750px] space-y-6">
            <Skeleton className="w-full aspect-[4/3] md:rounded-[40px]" />
            <div className="space-y-3 px-4 md:px-0">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-5 w-1/3" />
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 md:p-10 md:rounded-[40px] border border-slate-100 dark:border-slate-800 space-y-3">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 px-4 md:px-0">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-2xl" />
              ))}
            </div>
          </div>
          {/* Right sidebar */}
          <div className="lg:w-[400px] px-4 md:px-0 space-y-4">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 space-y-4">
              <Skeleton className="h-14 w-full rounded-2xl" />
              <Skeleton className="h-14 w-full rounded-2xl" />
            </div>
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl md:rounded-[40px] border border-slate-100 dark:border-slate-800 flex items-center gap-4">
              <Skeleton className="size-16 rounded-2xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   OWNER PROFILE SKELETON
────────────────────────────────────────────────────────── */
export function OwnerProfileSkeleton() {
  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 pb-24">
      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-6">
        <Skeleton className="h-8 w-20 mb-6" />
        {/* Hero card */}
        <div className="bg-white dark:bg-slate-900 rounded-[40px] overflow-hidden border border-slate-100 dark:border-slate-800 mb-8">
          <Skeleton className="h-28 w-full rounded-none" />
          <div className="px-8 pb-8 -mt-14 flex flex-col sm:flex-row sm:items-end gap-6">
            <Skeleton className="size-28 rounded-[28px] shrink-0 border-4 border-white dark:border-slate-900" />
            <div className="flex-1 pb-1 space-y-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-36" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-24 rounded-xl" />
                <Skeleton className="h-8 w-32 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
        {/* Tab bar */}
        <div className="bg-white dark:bg-slate-900 rounded-[20px] p-1.5 flex border border-slate-100 dark:border-slate-800 mb-8">
          <Skeleton className="flex-1 h-12 rounded-2xl" />
          <div className="w-2" />
          <Skeleton className="flex-1 h-12 rounded-2xl" />
        </div>
        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => <PropertyCardSkeleton key={i} />)}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   PROFILE / ACCOUNT SKELETON
────────────────────────────────────────────────────────── */
export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-transparent pb-28">
      {/* Dark banner */}
      <div className="h-[180px] bg-gradient-to-br from-[#1a227f] via-[#1e2a9a] to-[#0f1559]" />
      {/* White card */}
      <div className="max-w-lg mx-auto px-8 -mt-[140px] relative z-10">
        <div className="bg-white dark:bg-[#25243B] rounded-[28px] shadow-2xl pt-0 pb-4 px-4">
          {/* Avatar */}
          <div className="flex justify-center -mt-14 mb-3">
            <Skeleton className="size-[108px] rounded-[26px] border-4 border-white dark:border-[#25243B]" />
          </div>
          <div className="space-y-2 flex flex-col items-center">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-5 w-28 rounded-full" />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-3">
                <Skeleton className="size-12 rounded-2xl" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-3 w-14" />
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Menu sections */}
      <div className="max-w-lg mx-auto px-8 mt-4 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-[#25243B] rounded-[20px] p-4 flex items-center justify-between border border-slate-100 dark:border-white/[0.06]">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-xl" />
              <Skeleton className="h-5 w-36" />
            </div>
            <Skeleton className="size-5 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   EDIT PROFILE SKELETON
────────────────────────────────────────────────────────── */
export function EditProfileSkeleton() {
  return (
    <div className="min-h-screen bg-[#f6f6f8] dark:bg-[#161626] pb-28">
      <div className="max-w-lg mx-auto px-4 pt-8 space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="bg-white dark:bg-[#25243B] rounded-[28px] p-6 space-y-5 border border-slate-100 dark:border-white/[0.06]">
          <div className="flex justify-center">
            <Skeleton className="size-24 rounded-full" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-12 w-full rounded-2xl" />
            </div>
          ))}
          <Skeleton className="h-14 w-full rounded-2xl mt-2" />
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   REVIEWS SKELETON (for PropertyReviews & MyReviews pages)
────────────────────────────────────────────────────────── */
export function ReviewsSkeleton() {
  return (
    <div className="min-h-screen bg-[#f6f6f8] dark:bg-[#161626] pb-28">
      <div className="max-w-2xl mx-auto px-4 pt-8 space-y-5">
        <Skeleton className="h-8 w-40 mb-4" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-[#25243B] rounded-[22px] border border-slate-100 dark:border-white/[0.06] p-5 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="size-11 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   GENERIC PAGE SKELETON  (fallback for Suspense / all pages)
────────────────────────────────────────────────────────── */
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-[#f6f6f8] dark:bg-[#161626] pb-28">
      {/* Top bar */}
      <div className="h-16 bg-white dark:bg-[#25243B] border-b border-slate-100 dark:border-white/[0.06] flex items-center px-6">
        <Skeleton className="h-7 w-24" />
      </div>
      <div className="max-w-4xl mx-auto px-4 pt-8 space-y-6">
        {/* Hero area */}
        <Skeleton className="h-56 w-full rounded-[28px]" />
        {/* Content cards */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-[#25243B] rounded-[20px] p-5 border border-slate-100 dark:border-white/[0.06] space-y-3">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default Skeleton;
