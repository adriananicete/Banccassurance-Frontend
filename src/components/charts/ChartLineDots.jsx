/**
 * ============================================================================
 *  THIS FILE IS YOURS. Restyle it freely.
 * ============================================================================
 *
 * shadcn's "line chart with dots", converted to JSX. Three things changed from
 * what you pasted, all mechanical:
 *
 *   - `"use client"` removed. That is a Next.js directive; this is Vite.
 *   - `type ChartConfig` / `satisfies ChartConfig` removed. TypeScript only.
 *   - the demo data is still the demo data -- desktop/mobile, Jan-Jun 2024.
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
 *   className   Passed to the Card. `h-full` is what makes it fill a fixed-
 *               height row instead of following its own aspect ratio.
 *
 * ⚠️ THE LINE ITSELF HAS NO SOURCE YET, and it is worth knowing before you
 * trust it. The headline total is real; the line under it is demo data.
 * A month-by-month series does not exist in the API. `GET /reports/dashboard`
 * takes no dates at all, and `GET /reports/summary` takes a date RANGE but
 * groups by REGION / AREA / BRANCH / AO -- never by month. So the presets narrow
 * a period; nothing splits one into points on a line.
 *
 * Filling it is a DBA change, not a frontend one. Park it, or tell me and I
 * will write it up as a request.
 */
import { TrendingUp } from "lucide-react";
import { HiUserGroup } from "react-icons/hi";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

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
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--chart-2)",
  },
};

export function ChartLineDots({
  className,
  total,
  description = "Total referrals · all time",
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
          <LineChart
            accessibilityLayer
            data={chartData}
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
              content={<ChartTooltipContent hideLabel />}
            />
            <Line
              dataKey="desktop"
              type="natural"
              stroke="var(--color-desktop)"
              strokeWidth={2}
              dot={{
                fill: "var(--color-desktop)",
              }}
              activeDot={{
                r: 6,
              }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing total visitors for the last 6 months
        </div>
      </CardFooter>
    </Card>
  );
}
