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
 *   data         [{ month: "2026-04", referrals, approved }], oldest first.
 *   title        Card title. A noun.
 *   description  One sentence: what the chart shows AND over what period.
 *   loading / error   Passed to DataPlaceholder in place of the chart.
 *   className    Passed to the Card. Give the card's wrapper an explicit
 *                height; the chart fills whatever is left after the header
 *                and footer.
 *
 * ⚠️ THE MONTHLY SERIES HAS NO SOURCE IN THE API YET. See the note on
 * PLACEHOLDER in features/reports/pages/DashboardPage.jsx.
 */
import { useId } from "react";
import { TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { DataPlaceholder } from "@/components/DataPlaceholder";
import {
  Card,
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
  title = "Referrals by month",
  description,
  loading = false,
  error = null,
  className,
}) {
  // Gradient ids are document-global. useId keeps two of these charts on one
  // screen from painting with each other's fill; its punctuation is stripped
  // because it has to survive inside `url(#...)`.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const fillReferrals = `fillReferrals${uid}`;
  const fillApproved = `fillApproved${uid}`;

  const hasData = data.length > 0;

  // Derived from the series itself, so the footer can never disagree with the
  // shape above it.
  const busiest = hasData
    ? data.reduce((best, point) => (point.referrals > best.referrals ? point : best))
    : null;
  const average = hasData
    ? Math.round(data.reduce((sum, point) => sum + point.referrals, 0) / data.length)
    : null;

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>

      {/* `flex-1 min-h-0` lets the chart shrink to what is left of the card.
          Without min-h-0 a flex child will not go below its content size and
          the card overflows instead. */}
      <CardContent className="flex min-h-0 flex-1 items-center justify-center">
        {loading || error || !hasData ? (
          <DataPlaceholder
            loading={loading}
            error={error}
            empty="No referrals recorded yet."
            loadingLabel="Loading referrals..."
          />
        ) : (
          // aspect-auto beats ChartContainer's default aspect-video, so the
          // chart follows the card's height rather than its own ratio.
          <ChartContainer config={chartConfig} className="aspect-auto h-full w-full">
            <AreaChart accessibilityLayer data={data} margin={{ left: 12, right: 12, top: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => formatMonthShort(value)}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    labelFormatter={(value) => formatMonthYear(value)}
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
              <Area
                dataKey="approved"
                type="natural"
                fill={`url(#${fillApproved})`}
                fillOpacity={0.4}
                stroke="var(--color-approved)"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>

      {/* No "trending up by X%" line: there is no previous period to compare
          against anywhere in the API. The footer carries what the series can
          honestly answer instead -- the busiest month and the average. */}
      {busiest && !loading && !error ? (
        <CardFooter>
          <div className="grid gap-1.5 text-sm">
            <div className="flex items-center gap-2 leading-none font-medium">
              Busiest in {formatMonthYear(busiest.month)} ·{" "}
              {busiest.referrals.toLocaleString()} referrals
              <TrendingUp aria-hidden className="size-4" />
            </div>
            <div className="leading-none text-muted-foreground">
              Averaging {average.toLocaleString()} a month ·{" "}
              {formatMonthYear(data[0].month)} – {formatMonthYear(data.at(-1).month)}
            </div>
          </div>
        </CardFooter>
      ) : null}
    </Card>
  );
}
