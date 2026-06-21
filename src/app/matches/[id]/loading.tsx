import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 pt-8 sm:px-6 sm:pt-12">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}
