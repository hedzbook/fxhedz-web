function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2 p-2">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="h-[90px] border border-neutral-800 bg-neutral-900 animate-pulse"
        />
      ))}
    </div>
  )
}