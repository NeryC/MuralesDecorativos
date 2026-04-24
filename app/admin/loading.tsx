import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="flex min-h-dvh">
      <Skeleton className="hidden lg:block w-48 h-dvh" />
      <div className="flex-1 p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
