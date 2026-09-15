import { Search, Users } from "lucide-react";

import { DataPlaceholder } from "@/components/DataPlaceholder";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { avatarUrl } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import { formatCount } from "@/features/reports/dashboardFormat";

import { holdingsSummary } from "../assignmentsUtils";

/**
 * The left column of Assignments: the people this head assigns, the ones
 * holding nothing first. A row is the picture, the name and user code, and
 * under them what they hold -- or an amber "No branches yet", which is the
 * work. Pressing a row opens that person in the editor.
 *
 *   tier          ASSIGNMENT_TIERS entry.
 *   people        Already filtered and sorted by the page.
 *   selectedId / onSelect(person)
 *   search / onSearchChange
 *   loading / error
 */
export function PeopleCard({
  tier,
  people = [],
  selectedId,
  onSelect,
  search,
  onSearchChange,
  loading = false,
  error = null,
  className,
}) {
  const isEmpty = loading || error || people.length === 0;

  return (
    <Card className={cn("min-h-0 gap-3 overflow-hidden pb-0", className)}>
      <CardHeader className="gap-3">
        <CardTitle className="flex items-center gap-2">
          <Users aria-hidden className="size-4 text-muted-foreground" />
          {tier.people}
          <Badge variant="secondary" className="tabular-nums">
            {formatCount(people.length)}
          </Badge>
        </CardTitle>
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search name or user code"
            aria-label={`Search ${tier.people}`}
            className="pl-8 text-xs md:text-xs"
          />
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col border-t px-0">
        {isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-10 text-center">
            {loading || error ? (
              <DataPlaceholder
                loading={loading}
                error={error}
                loadingLabel={`Loading ${tier.people.toLowerCase()}...`}
                className="text-xs"
              />
            ) : (
              <>
                <span
                  aria-hidden
                  className="inline-flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground"
                >
                  <Users className="size-5" />
                </span>
                <span className="text-xs text-muted-foreground">
                  {search.trim()
                    ? `No ${tier.people} match “${search.trim()}”.`
                    : `No approved ${tier.people} to assign yet.`}
                </span>
              </>
            )}
          </div>
        ) : (
          <ScrollArea className="min-h-0 flex-1 [&_[data-slot=scroll-area-viewport]]:max-h-[36rem]">
            <ul className="divide-y">
              {people.map((person) => {
                const isSelected = person.userId === selectedId;
                const summary = holdingsSummary(tier, person.holdings);

                return (
                  <li key={person.userId}>
                    <button
                      type="button"
                      onClick={() => onSelect(person)}
                      aria-current={isSelected ? "true" : undefined}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-3 px-6 py-3 text-left transition-colors",
                        isSelected ? "bg-muted" : "hover:bg-muted/50",
                      )}
                    >
                      <UserAvatar src={avatarUrl(person.photo)} name={person.fullName} size="md" />
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-xs font-medium">
                          {person.fullName ?? person.userCode}
                          {person.userCode ? (
                            <span className="font-normal text-muted-foreground"> · {person.userCode}</span>
                          ) : null}
                        </span>
                        <HoldingsLine tier={tier} person={person} summary={summary} />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function HoldingsLine({ tier, person, summary }) {
  if (person.holdingsLoading) {
    return <span className="text-[10px] text-muted-foreground">Checking {tier.units}…</span>;
  }
  if (summary) {
    return <span className="truncate text-[10px] text-muted-foreground">{summary}</span>;
  }
  if (person.holdings?.straddles) {
    return <span className="truncate text-[10px] text-muted-foreground">Groups across regions</span>;
  }
  return (
    <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
      No {tier.multiple ? tier.units : tier.unit} yet
    </span>
  );
}
