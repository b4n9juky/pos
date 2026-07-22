"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-60 w-full" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-60 w-full" />
        </div>
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-60 w-full" />
        </div>
      </div>
    </div>
  )
}
