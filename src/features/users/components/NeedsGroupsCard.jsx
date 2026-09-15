import { ArrowRight, Inbox, MapPinOff } from "lucide-react";
import { Link } from "react-router";

import { DataPlaceholder } from "@/components/DataPlaceholder";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { avatarUrl } from "@/lib/apiClient";
import { formatCount } from "@/features/reports/dashboardFormat";

/**
 * "Need groups" -- the Area Sales Heads under a Regional Sales Head who hold
 * no groups yet, each one click from the Assignments page. An area head with no
 * groups cannot approve anyone, so this is work, not a figure (F11).
 *
 * The same card as PendingApprovalsCard (Adrian's approvalCard.png): an icon,
 * a title and a count pill, then a row per person with the action on the right.
 *
 *   people    [{ userId, userCode, fullName, photo }]
 *   loading / error
 *   assignTo  The route of the Assignments page.
 */
export function NeedsGroupsCard({ people = [], loading = false, error = null, assignTo }) {
  const isEmpty = loading || error || people.length === 0;

  return (
    <Card className="h-full gap-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPinOff aria-hidden className="size-4 text-muted-foreground" />
          Need groups
          <Badge variant="secondary" className="tabular-nums">
            {loading ? "—" : formatCount(people.length)}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col">
        {isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center">
            {loading || error ? (
              <DataPlaceholder
                loading={loading}
                error={error}
                loadingLabel="Loading Area Sales Heads..."
                className="text-xs"
              />
            ) : (
              <>
                <span
                  aria-hidden
                  className="inline-flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground"
                >
                  <Inbox className="size-5" />
                </span>
                <span className="text-xs text-muted-foreground">Every Area Sales Head has groups.</span>
              </>
            )}
          </div>
        ) : (
          <ul className="flex flex-col">
            {people.map((person) => (
              <li key={person.userId} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <UserAvatar src={avatarUrl(person.photo)} name={person.fullName} size="md" />
                  <div className="min-w-0">
                    <div className="truncate text-sm">
                      <span className="font-medium">{person.fullName ?? person.userCode}</span>
                      {person.userCode ? (
                        <span className="text-muted-foreground"> · {person.userCode}</span>
                      ) : null}
                    </div>
                    <div className="truncate text-xs text-amber-600 dark:text-amber-400">Holds no groups yet</div>
                  </div>
                </div>
                {/* A real link to Assignments, drawn as a Button (Base UI `render`). */}
                <Button
                  size="sm"
                  variant="outline"
                  nativeButton={false}
                  render={<Link to={assignTo} />}
                  className="shrink-0 text-xs"
                >
                  Assign
                  <ArrowRight data-icon="inline-end" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
