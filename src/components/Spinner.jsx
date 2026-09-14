import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const SIZES = {
  xs: "size-3",
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
  xl: "size-8",
};

/**
 * The one loading indicator. `label` is shown beside it when given; without
 * one, screen readers still hear "Loading" rather than nothing.
 */
export function Spinner({ size = "sm", label, className }) {
  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center gap-2 text-sm text-muted-foreground",
        className,
      )}
    >
      <Loader2 aria-hidden className={cn("animate-spin", SIZES[size])} />
      {label ? <span>{label}</span> : <span className="sr-only">Loading</span>}
    </span>
  );
}
