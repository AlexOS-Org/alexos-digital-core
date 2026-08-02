import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StatusMeta } from "@/lib/dailygear/constants";

export function StatusBadge({ meta, className }: { meta: StatusMeta; className?: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium", meta.className, className)}>
      {meta.label}
    </Badge>
  );
}
