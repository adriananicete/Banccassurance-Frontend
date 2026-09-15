import { cn } from "@/lib/utils";

/**
 * Tile tints -- a faint fill and a border in the same hue, as in Adrian's
 * screenshots/card.png and card2.png. Each carries a meaning, and each is
 * low-opacity with a `dark:` pair so it reads in both themes. Defined here
 * once -- never inline a tint in a component.
 */
const TILE_ACCENT = {
  /** A running total. */
  total: "border-blue-100 bg-blue-50/50 dark:border-blue-500/20 dark:bg-blue-500/10",
  /** Something that finished well -- approved, closed. */
  done: "border-green-100 bg-green-50/50 dark:border-green-500/20 dark:bg-green-500/10",
  /** Something that stopped -- declined, lost. */
  stopped: "border-red-100 bg-red-50/50 dark:border-red-500/20 dark:bg-red-500/10",
  /** Something waiting on someone. */
  queue: "border-amber-100 bg-amber-50/50 dark:border-amber-500/20 dark:bg-amber-500/10",
  /** A rate -- conversion. */
  rate: "border-violet-100 bg-violet-50/50 dark:border-violet-500/20 dark:bg-violet-500/10",
  /** A share of a whole. */
  share: "border-cyan-100 bg-cyan-50/50 dark:border-cyan-500/20 dark:bg-cyan-500/10",
  /** Moving along -- presented. */
  progress: "border-violet-100 bg-violet-50/50 dark:border-violet-500/20 dark:bg-violet-500/10",
  /** Pushed to later -- postponed. */
  delayed: "border-orange-100 bg-orange-50/50 dark:border-orange-500/20 dark:bg-orange-500/10",
  /** Put on hold -- deferred. */
  held: "border-yellow-100 bg-yellow-50/50 dark:border-yellow-500/20 dark:bg-yellow-500/10",
  /** Over, with nothing to show -- lost. */
  ended: "border-slate-200 bg-slate-50/60 dark:border-slate-500/20 dark:bg-slate-500/10",
};

/**
 * The `fade` variant: the accent as a gradient rising from the bottom edge --
 * 5% of the hue, 15% on hover -- over the card colour, in place of the flat
 * fill (Adrian, 2026-09-15, the Reports status tiles). The accent's border is
 * kept. Full class strings so Tailwind generates them.
 */
const TILE_FADE = {
  total: "from-blue-500/5 hover:from-blue-500/15",
  done: "from-green-500/5 hover:from-green-500/15",
  stopped: "from-red-500/5 hover:from-red-500/15",
  queue: "from-amber-500/5 hover:from-amber-500/15",
  rate: "from-violet-500/5 hover:from-violet-500/15",
  share: "from-cyan-500/5 hover:from-cyan-500/15",
  progress: "from-violet-500/5 hover:from-violet-500/15",
  delayed: "from-orange-500/5 hover:from-orange-500/15",
  held: "from-yellow-500/5 hover:from-yellow-500/15",
  ended: "from-slate-500/5 hover:from-slate-500/15",
};

/** The border of a pressed tile, in its accent's hue. Neutral tiles use the ring token. */
const TILE_PRESSED = {
  total: "border-blue-400/70 ring-1 ring-blue-400/70 dark:border-blue-400/50 dark:ring-blue-400/50",
  done: "border-green-500/60 ring-1 ring-green-500/60 dark:border-green-400/50 dark:ring-green-400/50",
  stopped: "border-red-400/70 ring-1 ring-red-400/70 dark:border-red-400/50 dark:ring-red-400/50",
  queue: "border-amber-400/80 ring-1 ring-amber-400/80 dark:border-amber-400/50 dark:ring-amber-400/50",
  rate: "border-violet-400/70 ring-1 ring-violet-400/70 dark:border-violet-400/50 dark:ring-violet-400/50",
  share: "border-cyan-400/70 ring-1 ring-cyan-400/70 dark:border-cyan-400/50 dark:ring-cyan-400/50",
  progress: "border-violet-400/70 ring-1 ring-violet-400/70 dark:border-violet-400/50 dark:ring-violet-400/50",
  delayed: "border-orange-400/70 ring-1 ring-orange-400/70 dark:border-orange-400/50 dark:ring-orange-400/50",
  held: "border-yellow-400/80 ring-1 ring-yellow-400/80 dark:border-yellow-400/50 dark:ring-yellow-400/50",
  ended: "border-slate-400/70 ring-1 ring-slate-400/70 dark:border-slate-400/50 dark:ring-slate-400/50",
};

/**
 * One figure, in a grid of them.
 *
 *   label   MUST NAME ITS WINDOW -- "Referrals · all time", never "Total".
 *           The same metric over a different period elsewhere otherwise reads
 *           as a broken calculation.
 *   value   A formatted string or number, or a node (a Skeleton while loading).
 *           Null or undefined renders "—", which keeps the grid intact when a
 *           figure is missing or not for this role.
 *   icon    A lucide component. Decorative.
 *   hint    One muted line under the value.
 *   accent  A key of TILE_ACCENT, or nothing for a neutral tile.
 *   fade    With an accent: a gradient from the bottom (5%, 15% on hover)
 *           instead of the flat fill.
 *   onClick / pressed   Optional. Makes the tile a toggle -- a filter, say --
 *           with button semantics, a hover shadow, and a border in its accent
 *           when pressed (the Approvals page, 2026-09-15).
 *
 * Sit tiles in `grid grid-cols-2 auto-rows-fr gap-3` -- two columns at every
 * width, so a phone never gets one tall stack.
 */
export function StatTile({
  label,
  value,
  icon: Icon,
  hint,
  accent,
  fade = false,
  onClick,
  pressed = false,
  className,
}) {
  const interactive = Boolean(onClick);

  return (
    <div
      {...(interactive
        ? {
            role: "button",
            tabIndex: 0,
            "aria-pressed": pressed,
            onClick,
            onKeyDown: (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            },
          }
        : {})}
      className={cn(
        "flex flex-col gap-2 rounded-lg border p-4",
        accent ? TILE_ACCENT[accent] : null,
        // bg-card (and its dark pair) replaces the flat fill; the gradient sits on top.
        accent && fade && ["bg-card bg-linear-to-t to-card dark:bg-card", TILE_FADE[accent]],
        interactive &&
          "cursor-pointer transition-shadow outline-none hover:shadow-sm focus-visible:ring-[3px] focus-visible:ring-ring/50",
        interactive && pressed && (accent ? TILE_PRESSED[accent] : "border-ring ring-1 ring-ring"),
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
