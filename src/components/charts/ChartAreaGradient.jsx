/**
 * shadcn's "area chart with gradient fill", converted to JSX: no `"use client"`
 * (Next.js only), no TypeScript, and data from props instead of the demo set.
 *
 * TWO SERIES, NOT STACKED. The shadcn demo stacks its two areas, which is right
 * for desktop + mobile -- they are separate visitors and add up. Referrals and
 * approvals do not: every approval is also a referral. Stacked, a month with
 * 110 referrals and 33 approvals would peak at 143, a number that exists
 * nowhere. So the two overlap, approvals drawn on top, and the top edge of the
 * back area is the real referral count.
 *
 * The props:
 *
 *   data           [{ month: "2026-04", referrals, approved }], oldest first.
 *   headline       Number, or null. The big figure at the top of the card.
 *                  Null renders an em dash rather than a zero.
 *   headlineLabel  The line under it. MUST NAME THE PERIOD the figure covers.
 *   headlineApproved  Number, or null. How many of `headline` were approved.
 *                  While "Compare with approved" is on, its share of the
 *                  headline shows beside the number, in the approved green.
 *   title          What the chart is. Shown in the footer, under the chart.
 *   description    One sentence under the title: what is plotted, and where.
 *   empty          What to say when data is empty. Name the reason.
 *
 *   sliderRange    { startIndex, endIndex }, or null. When given, a slider
 *                  (Recharts Brush) sits under the axis and opens on that range.
 *   loading / error   Passed to DataPlaceholder in place of the chart.
 *   className      Passed to the Card. Give the card's wrapper an explicit
 *                  height; the chart fills whatever is left after the header
 *                  and footer.
 *
 * Referrals are drawn alone by default; a "Compare with approved" toggle in
 * the header adds the approved series on top.
 *
 * A point whose value is null keeps its place on the axis but draws nothing,
 * breaking the line. The dashboards send 0 instead, so the line stays whole.
 */
import { useId, useState } from "react";
import { HiUserGroup } from "react-icons/hi";
import { Area, AreaChart, Brush, CartesianGrid, XAxis } from "recharts";

import { DataPlaceholder } from "@/components/DataPlaceholder";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Toggle } from "@/components/ui/toggle";
import { formatMonthShort, formatMonthYear } from "@/lib/datetime";
import { cn } from "@/lib/utils";

const chartConfig = {
  /*
    Light/dark pairs rather than --chart-1 and --chart-2. The default shadcn
    palette does not hold a hue across themes -- --chart-1 is orange in light
    and indigo in dark -- so a series would change colour when the theme does.
    ChartContainer turns each entry into `--color-<key>`.
  */
  referrals: {
    label: "Referrals",
    theme: { light: "var(--color-blue-600)", dark: "var(--color-blue-400)" },
  },
  approved: {
    label: "Approved",
    theme: { light: "var(--color-emerald-500)", dark: "var(--color-emerald-400)" },
  },
};

export function ChartAreaGradient({
  data = [],
  headline = null,
  headlineLabel,
  headlineApproved = null,
  title = "Referrals by month",
  description,
  empty = "No referrals recorded yet.",
  sliderRange = null,
  loading = false,
  error = null,
  className,
}) {
  // Gradient ids are document-global. useId keeps two of these charts on one
  // screen from painting with each other's fill; its punctuation is stripped
  // because it has to survive inside `url(#...)`.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");

  // Referrals alone by default (Adrian); approved is drawn only on request.
  // Pure display state, so it lives here and survives the period and region
  // changing underneath it.
  const [showApproved, setShowApproved] = useState(false);
  const fillReferrals = `fillReferrals${uid}`;
  const fillApproved = `fillApproved${uid}`;

  const hasData = data.length > 0;
  /*
    An area needs two points to have a width. "This month" is one month, and
    one point draws no line and no fill at all -- the chart just goes blank.

    So a single month is plotted twice, once at each edge, which draws it as a
    flat band across the card: the honest shape of one value. Points are
    addressed by `slot` rather than by month so the two copies stay distinct,
    and only the first slot gets a tick, so the month is labelled once.
  */
  const plotted =
    data.length === 1
      ? [
          { ...data[0], slot: "0" },
          { ...data[0], slot: "1" },
        ]
      : data.map((point, index) => ({ ...point, slot: String(index) }));
  const monthAt = (slot) => plotted[Number(slot)]?.month;
  return (
    <Card className={cn("h-full", className)}>
      {/* A rule under the header and over the footer, per Adrian, so the headline,
          the chart and its caption read as three parts. Tighter than the Card
          default so the fixed-height chart keeps its room. */}
      <CardHeader className="border-b [.border-b]:pb-4">
        {/* The number is the headline and the words explain it. */}
        <CardTitle className="flex items-center gap-2 text-3xl font-semibold tabular-nums">
          {/* Decorative -- the label below already names the figure. */}
          <HiUserGroup aria-hidden className="size-7 text-muted-foreground" />
          {loading || error || headline == null ? "—" : headline.toLocaleString("en-PH")}
          {/* The approved share, only while comparing (Adrian): the same
              question the green line answers, as one figure. Green #00bb7c,
              the approved colour; nothing shown when there is nothing to divide. */}
          {showApproved && !loading && !error && headline > 0 && headlineApproved != null ? (
            <span className="rounded-md bg-[#00bb7c]/10 px-1.5 py-0.5 text-xs font-medium text-[#00bb7c] tabular-nums">
              {Math.round((headlineApproved / headline) * 100)}% approved
            </span>
          ) : null}
        </CardTitle>
        {headlineLabel ? <CardDescription>{headlineLabel}</CardDescription> : null}

        {/* Opposite the headline: the compare toggle, hidden when there is no
            chart to compare on. A toggle, so it says whether it is on --
            aria-pressed and a muted fill. Neutral, not green: Adrian took the
            colour off. */}
        <CardAction className="flex items-center gap-2">
          {hasData && !loading && !error ? (
            <Toggle
              variant="outline"
              pressed={showApproved}
              onPressedChange={setShowApproved}
              className="text-xs"
            >
              Compare with approved
            </Toggle>
          ) : null}
        </CardAction>
      </CardHeader>

      {/* `flex-1 min-h-0` lets the chart shrink to what is left of the card.
          Without min-h-0 a flex child will not go below its content size and
          the card overflows instead. */}
      <CardContent className="flex min-h-0 flex-1 items-center justify-center">
        {loading || error || !hasData ? (
          <DataPlaceholder
            loading={loading}
            error={error}
            empty={empty}
            loadingLabel="Loading referrals..."
          />
        ) : (
          // aspect-auto beats ChartContainer's default aspect-video, so the
          // chart follows the card's height rather than its own ratio.
          <ChartContainer config={chartConfig} className="aspect-auto h-full w-full">
            <AreaChart accessibilityLayer data={plotted} margin={{ left: 12, right: 12, top: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="slot"
                ticks={data.length === 1 ? ["0"] : undefined}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 11 }}
                tickFormatter={(slot) => formatMonthShort(monthAt(slot))}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    labelFormatter={(_, payload) => formatMonthYear(payload?.[0]?.payload?.month)}
                  />
                }
              />
              <defs>
                <linearGradient id={fillReferrals} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-referrals)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-referrals)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id={fillApproved} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-approved)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-approved)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <Area
                dataKey="referrals"
                type="natural"
                fill={`url(#${fillReferrals})`}
                fillOpacity={0.4}
                stroke="var(--color-referrals)"
              />
              {showApproved ? (
                <Area
                  dataKey="approved"
                  type="natural"
                  fill={`url(#${fillApproved})`}
                  fillOpacity={0.4}
                  stroke="var(--color-approved)"
                />
              ) : null}

              {/* The slider under the axis -- All time only, where twelve months
                  are laid out (Adrian). Drag the handles or the band to choose
                  which months the chart above shows. Keyed on the range, so a
                  new starting window resets it rather than keeping a stale drag. */}
              {sliderRange ? (
                <Brush
                  key={`${sliderRange.startIndex}-${sliderRange.endIndex}`}
                  dataKey="slot"
                  height={24}
                  travellerWidth={8}
                  startIndex={sliderRange.startIndex}
                  endIndex={sliderRange.endIndex}
                  stroke="var(--color-referrals)"
                  fill="var(--color-card)"
                  tickFormatter={(slot) => formatMonthShort(monthAt(slot))}
                />
              ) : null}
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>

      <CardFooter className="border-t [.border-t]:pt-4">
        <div className="grid gap-1.5 text-sm">
          <div className="leading-none font-medium">{title}</div>
          {description ? (
            <div className="leading-none text-muted-foreground">{description}</div>
          ) : null}
        </div>
      </CardFooter>
    </Card>
  );
}
