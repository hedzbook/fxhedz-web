"use client"

export default function DashboardSkeleton() {

  const skeletons = Array.from({ length: 8 })

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3">

      {skeletons.map((_, i) => (

        <div
          key={i}
          className="
          h-28
          rounded-md
          bg-neutral-800
          animate-pulse
        "
        />

      ))}

    </div>
  )
}