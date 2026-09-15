import { CircleCheck, CircleDashed, MapPinned, Users } from "lucide-react";

import { StatTile } from "@/components/StatTile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCount } from "@/features/reports/dashboardFormat";

import { PEOPLE_FILTER } from "../assignmentsUtils";

/**
 * The Assignments screen's frame: header, the overview tiles, then the People
 * list and the editor side by side (Adrian, 2026-09-15: master-detail).
 *
 * The overview is Adrian's card.png StatTiles. The first three are the people
 * list's filter -- everyone, those holding nothing (amber, the work), those
 * holding something (green); the fourth counts what this head has to give out.
 *
 *   tier
 *   counts        { all, none, assigned, pool } -> number | null
 *   countsLoading
 *   poolLabel / poolHint   The fourth tile ("Free branches" / "unassigned in your groups").
 *   filter / onFilterChange
 *   list / editor          The two columns, rendered by the page.
 */
export function AssignmentsView({
  tier,
  counts,
  countsLoading = false,
  poolLabel,
  poolHint,
  filter,
  onFilterChange,
  list,
  editor,
}) {
  const value = (count) => (countsLoading ? <Skeleton className="h-8 w-10" /> : count == null ? null : formatCount(count));
  const noneLabel = `No ${tier.multiple ? tier.units : tier.unit} yet`;

  return (
    <div className="flex w-full flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold md:text-2xl">Assignments</h1>
        <p className="text-sm text-muted-foreground">{tier.sentence}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>
            What your {tier.people} cover · pick a tile to filter the list
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid auto-rows-fr grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile
              label={tier.people}
              value={value(counts.all)}
              icon={Users}
              hint="approved, under you"
              accent="total"
              onClick={() => onFilterChange(PEOPLE_FILTER.ALL)}
              pressed={filter === PEOPLE_FILTER.ALL}
            />
            <StatTile
              label={noneLabel}
              value={value(counts.none)}
              icon={CircleDashed}
              hint="need you to assign"
              accent="queue"
              onClick={() => onFilterChange(PEOPLE_FILTER.NONE)}
              pressed={filter === PEOPLE_FILTER.NONE}
            />
            <StatTile
              label={`With ${tier.multiple ? tier.units : "a " + tier.unit}`}
              value={value(counts.assigned)}
              icon={CircleCheck}
              hint="ready to work"
              accent="done"
              onClick={() => onFilterChange(PEOPLE_FILTER.ASSIGNED)}
              pressed={filter === PEOPLE_FILTER.ASSIGNED}
            />
            <StatTile label={poolLabel} value={value(counts.pool)} icon={MapPinned} hint={poolHint} accent="share" />
          </div>
        </CardContent>
      </Card>

      {/* People 2/5, editor 3/5 from lg. Below lg the page shows one of the
          two at a time. */}
      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[2fr_3fr] lg:items-start">
        {list}
        {editor}
      </div>
    </div>
  );
}
