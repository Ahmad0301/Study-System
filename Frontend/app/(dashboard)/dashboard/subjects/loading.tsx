import { Skeleton } from "@/components/ui/skeleton";

export default function SubjectsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded-xl" />
          <Skeleton className="h-4 w-80 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      <div className="flex items-center gap-3">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-12 w-12 rounded-2xl" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-6 w-40 rounded-lg" />
            <Skeleton className="h-4 w-full rounded-md" />
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between">
              <Skeleton className="h-4 w-20 rounded-md" />
              <Skeleton className="h-4 w-16 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
