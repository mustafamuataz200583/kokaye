import { STATUS_LABELS, type OrderStatus } from "@/lib/constants";
import { cn } from "@/lib/format";

const TONE: Record<OrderStatus, string> = {
  new: "bg-champagne/25 text-cocoa ring-champagne/50",
  confirmed: "bg-forest/8 text-forest ring-forest/20",
  preparing: "bg-forest/12 text-forest ring-forest/25",
  out_for_delivery: "bg-forest-soft/15 text-forest-deep ring-forest-soft/30",
  delivered: "bg-forest text-ivory ring-forest",
  cancelled: "bg-cocoa/8 text-cocoa/60 ring-cocoa/15",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset", TONE[status])}>
      {status === "new" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-champagne" />}
      {STATUS_LABELS[status]}
    </span>
  );
}
