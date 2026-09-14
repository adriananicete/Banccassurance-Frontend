import { Spinner } from "@/components/Spinner";
import { cn } from "@/lib/utils";

/**
 * What sits in the empty slot of every data view -- a table body, a chart, a
 * stat card, a feed. Loading wins, then the error, then the empty message; the
 * three never stack.
 *
 * `error` may be a string or an Error (an ApiError included). Its message is
 * the backend's own wording and is shown as-is -- see lib/apiClient.js.
 *
 * Write a specific `empty`. "No records found." is the fallback, not the goal.
 */
export function DataPlaceholder({
  loading = false,
  error = null,
  empty = "No records found.",
  loadingLabel = "Loading...",
  className,
}) {
  if (loading) return <Spinner label={loadingLabel} className={className} />;

  const message = typeof error === "string" ? error : error?.message;

  return (
    <span
      className={cn(
        "text-sm",
        message ? "text-destructive" : "text-muted-foreground",
        className,
      )}
    >
      {message || empty}
    </span>
  );
}
