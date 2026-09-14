import { cn } from "@/lib/utils";

/**
 * Tile tints. Each carries a meaning, and each is low-opacity with a `dark:`
 * pair so it reads in both themes. Defined here once -- never inline a tint in
 * a component.
 */
const TILE_ACCENT = {
  /** A running total. */
  total: "bg-blue-50/50 dark:bg-blue-500/10",
  /** Something that finished well -- approved, closed. */
  done: "bg-green-50/50 dark:bg-green-500/10",
  /** Something that stopped -- declined, lost. */
  stopped: "bg-red-50/50 dark:bg-red-500/10",
  /** Something waiting on someone. */
  queue: "bg-amber-50/50 dark:bg-amber-500/10",
};

/**
 * One figure, in a grid of them.
 *
 *   label   MUST NAME ITS WINDOW -- "Referrals · all time", never "Total".
 *           The same metric over a different period elsewhere otherwise reads
 *           as a broken calculation.
 *   value   A formatted string or number. Null or undefined renders "—", which
 *           keeps the grid intact when a figure is missing or not for this role.
 *   icon    A lucide component. Decorative.
 *   hint    One muted line under the value.
 *   accent  A key of TILE_ACCENT, or nothing for a neutral tile.
 *
 * Sit tiles in `grid grid-cols-2 auto-rows-fr gap-3` -- two columns at every
 * width, so a phone never gets one tall stack.
 */
export function StatTile({ label, value, icon: Icon, hint, accent, className }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border p-4",
        accent ? TILE_ACCENT[accent] : null,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2 text-xs text-muted-foreground">
        <span>{label}</span>
        {Icon ? <Icon aria-hidden className="size-4 shrink-0" /> : null}
      </div>

      <span className="text-2xl font-semibold tabular-nums">{value ?? "—"}</span>

      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </div>
  );
}
