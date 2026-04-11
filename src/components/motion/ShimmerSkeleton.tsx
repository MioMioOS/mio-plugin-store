"use client";

interface ShimmerSkeletonProps {
  className?: string;
}

export function ShimmerSkeleton({ className = "" }: ShimmerSkeletonProps) {
  return (
    <div className={`relative overflow-hidden bg-card rounded-lg ${className}`}>
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(202,255,0,0.04), transparent)",
          animation: "shimmer 1.5s infinite",
          transform: "translateX(-100%)",
        }}
      />
    </div>
  );
}

export function PluginCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/50 bg-card">
      {/* Preview area */}
      <ShimmerSkeleton className="h-40 rounded-none" />
      {/* Info */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <ShimmerSkeleton className="h-4 w-3/4" />
            <ShimmerSkeleton className="h-3 w-1/2" />
          </div>
          <ShimmerSkeleton className="h-5 w-12 ml-2" />
        </div>
        <div className="flex items-center gap-3">
          <ShimmerSkeleton className="h-3 w-10" />
          <ShimmerSkeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}
