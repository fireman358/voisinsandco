export function BusinessCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="flex items-start gap-2.5">
        <div className="size-10 shrink-0 rounded-xl bg-neutral-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-neutral-200" />
          <div className="h-3 w-1/2 rounded bg-neutral-200" />
        </div>
        <div className="h-5 w-16 rounded-full bg-neutral-200" />
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-3 w-3/4 rounded bg-neutral-200" />
        <div className="h-3 w-1/2 rounded bg-neutral-200" />
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 4, columns = false }: { count?: number; columns?: boolean }) {
  return (
    <div className={columns ? "grid gap-3 md:grid-cols-2" : "space-y-3"}>
      {Array.from({ length: count }).map((_, i) => (
        <BusinessCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function RowSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="h-4 w-1/2 rounded bg-neutral-200" />
          <div className="mt-2 h-3 w-3/4 rounded bg-neutral-200" />
        </div>
      ))}
    </div>
  );
}
