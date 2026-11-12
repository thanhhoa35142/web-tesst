import { Badge } from "@/components/ui/badge";
import { cn } from "cn";

const STYLES: Record<string, string> = {
  ok: "bg-foreground text-background hover:bg-foreground",
  failed: "bg-destructive text-destructive-foreground hover:bg-destructive",
  skipped: "bg-muted text-muted-foreground hover:bg-muted",
  pending: "bg-secondary text-secondary-foreground hover:bg-secondary",
  accepted: "bg-foreground text-background hover:bg-foreground",
  rejected: "bg-muted text-muted-foreground line-through hover:bg-muted",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="secondary"
      className={cn("font-mono text-xs", STYLES[status] ?? "")}
    >
      {status}
    </Badge>
  );
}
