import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="h-56 bg-muted flex items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
      <CardHeader>
        <Skeleton className="h-4 w-2/3 mb-2" />
        <Skeleton className="h-3 w-full mb-1" />
        <Skeleton className="h-3 w-5/6" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-6 w-24" />
      </CardContent>
    </Card>
  );
}

