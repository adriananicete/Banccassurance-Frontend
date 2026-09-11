/**
 * ============================================================================
 *  THIS FILE IS YOURS. Restyle it freely.
 * ============================================================================
 *
 * shadcn's "bar chart with a custom label", converted to JSX. Back to the shape
 * you pasted -- `month` / `desktop` keys, the original title and footer. The
 * only thing added is the `data` prop, because the dashboard swaps the numbers
 * when a region tab is picked.
 *
 * The props:
 *
 *   data        [{ month, desktop }]. Defaults to the demo set so the card still
 *               renders if dropped in on its own. The dashboard passes the
 *               picked region's own numbers, and they add up to that region's
 *               total -- NCR's six sum to 310, not to the tenant's 847.
 *   className   Passed to the Card. `h-full` makes it fill a fixed-height row
 *               rather than following its own aspect ratio.
 *
 * ⚠️ The month labels have no source yet. Nothing in the API returns referrals
 * split by month -- `/reports/dashboard` takes no dates and `/reports/summary`
 * groups by REGION / AREA / BRANCH / AO. So the SHAPE is placeholder even where
 * the totals are real. Same note as the line chart.
 *
 * One more: the demo gives `desktop` and `mobile` the SAME colour
 * (`--chart-2`). Fine while one series is drawn, misleading the moment a second
 * is.
 */
import { TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";

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
    color: "var(--chart-2)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--chart-2)",
  },
  label: {
    color: "var(--background)",
  },
};

export function ChartBarLabelCustom({ className, data = chartData }) {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <CardTitle>Bar Chart - Custom Label</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      {/* See the note in ChartLineDots -- min-h-0 is what allows the shrink. */}
      <CardContent className="min-h-0 flex-1">
        <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
          <BarChart
            accessibilityLayer
            data={data}
            layout="vertical"
            margin={{
              right: 16,
            }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="month"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
              hide
            />
            <XAxis dataKey="desktop" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4}>
              <LabelList
                dataKey="month"
                position="insideLeft"
                offset={8}
                className="fill-(--color-label)"
                fontSize={12}
              />
              <LabelList
                dataKey="desktop"
                position="right"
                offset={8}
                className="fill-foreground"
                fontSize={12}
              />
            </Bar>
          </BarChart>
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
