export default function ListingSkeleton() {
    return (
        <article className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
            <div className="animate-pulse">
                <div className="h-32 bg-gray-200" />
                <div className="space-y-3 p-4">
                    <div className="h-4 w-3/4 rounded bg-gray-200" />
                    <div className="h-4 w-1/2 rounded bg-gray-200" />
                    <div className="h-3 w-2/3 rounded bg-gray-200" />
                    <div className="h-8 w-full rounded-lg bg-gray-200" />
                </div>
            </div>
        </article>
    );
}
