/**
 * ============================================================================
 *  THIS FILE IS YOURS. Restyle it freely.
 * ============================================================================
 *
 * shadcn's "simple area chart", converted to JSX. The mechanical changes are the
 * same three as before: no `"use client"` (Next.js only), no TypeScript, demo
 * data left alone.
 *
 * CARRIED OVER FROM THE LINE CHART IT REPLACES: the header. You asked for the
 * all-time total as the headline with an icon before it, so that is here rather
 * than shadcn's plain "Area Chart" title. Say the word if you wanted the plain
 * one back.
 *
 * The props:
 *
 *   total       Number, or undefined. The figure shown as the card's headline.
 *               ALWAYS ALL TIME, whichever region it is for. Undefined renders
 *               an em dash rather than throwing, because this is the one value
 *               on screen that arrives from the network.
 *   description The line under it. Say what the number counts AND that it is
 *               all time -- the caller changes the number when a region tab is
 *               picked, and a stale label is worse than no label.
 *   data        [{ month, desktop }]. Defaults to the demo set.
 *   className   Passed to the Card. `h-full` is what makes it fill a fixed-
 *               height row instead of following its own aspect ratio.
 *
 * ⚠️ THE AREA ITSELF HAS NO SOURCE YET. The headline total is real; the shape
 * under it is demo data. A month-by-month series does not exist in the API --
 * `GET /reports/dashboard` takes no dates at all, and `GET /reports/summary`
 * takes a date RANGE but groups by REGION / AREA / BRANCH / AO, never by month.
 * So the presets narrow a period; nothing splits one into points on a curve.
 *
 * Filling it is a DBA change, not a frontend one. Park it, or tell me and I
 * will write it up as a request.
 */
import { TrendingUp } from "lucide-react";
import { HiUserGroup } from "react-icons/hi";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

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
import { cn } from "@/lib/utils";

const chartData = [
  { month: "January", desktop: 186 },
  { month: "February", desktop: 305 },
  { month: "March", desktop: 237 },
  { month: "April", desktop: 73 },
  { month: "May", desktop: 209 },
  { month: "June", desktop: 214 },
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    /*
      Blue, and deliberately NOT one of the --chart-* tokens.

      The default shadcn palette does not hold a hue across themes: --chart-1 is
      orange in light and indigo in dark, and --chart-3 is blue in light but
      orange in dark. Either one would flip colour the moment that moon icon in
      the header starts working.

      A light/dark pair keeps it blue in both, and lighter in dark so it still
      reads against the dark ground. ChartContainer turns this into
      `--color-desktop`, which is what the Area below paints with.
    */
    theme: {
      light: "var(--color-blue-600)",
      dark: "var(--color-blue-400)",
    },
  },
};

export function ChartAreaDefault({
  className,
  total,
  description = "Total referrals · all time",
  data = chartData,
}) {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        {/* The number is the headline and the words explain it, rather than the
            other way round. "All time" is not decoration: this figure has no
            period filter behind it, and without saying so it reads as a figure
            for the current month. */}
        <CardTitle className="flex items-center gap-2 text-3xl font-semibold tabular-nums">
          {/* Decorative -- the words below already name the figure, so hiding
              it from assistive tech saves a screen reader announcing "user
              group" before the number. */}
          <HiUserGroup aria-hidden className="size-7 text-muted-foreground" />
          {total?.toLocaleString() ?? "—"}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {/* `flex-1 min-h-0` is what lets the chart shrink to whatever height is
          left after the header and footer. Without min-h-0 a flex child refuses
          to go below its content size and the card overflows instead. */}
      <CardContent className="min-h-0 flex-1">
        {/* aspect-auto beats ChartContainer's default aspect-video, so the
            chart follows the card's height rather than its own ratio. */}
        <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Area
              dataKey="desktop"
              type="natural"
              fill="var(--color-desktop)"
              fillOpacity={0.4}
              stroke="var(--color-desktop)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-xs">
          <div className="grid gap-1.5">
            <div className="flex items-center gap-1.5 leading-none font-medium">
              Trending up by 5.2% this month <TrendingUp className="h-3 w-3" />
            </div>
            <div className="flex items-center gap-1.5 leading-none text-muted-foreground">
              January - June 2024
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
