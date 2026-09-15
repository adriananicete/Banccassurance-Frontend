import { CircleCheck, Inbox, UserRoundCheck } from "lucide-react";

import { DataPlaceholder } from "@/components/DataPlaceholder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/datetime";
import { formatCount } from "@/features/reports/dashboardFormat";

/**
 * "Awaiting your approval" -- the newest pending registrations, each one click
 * from the confirm dialog. The left slot of the Approvals page.
 *
 * Built on Adrian's screenshots/approvalCard.png (2026-09-15), his other app's
 * "RFs awaiting voucher": an icon, a title and a count pill; then one row per
 * item -- a bold first line with a muted second fact after a dot, a muted
 * second line, and a green action on the right. Here the first line is the
 * person and their employee number, the second is where they registered
 * (group / branch / region) and when, and the action is Approve in the
 * approved green #00bb7c. Reject stays in the table below, behind its own
 * confirm.
 *
 *   rows       [{ userId, fullName, userCode, employeeNo, place, createdAt, ... }]
 *              -- `place` is already resolved by the page.
 *   count      Every pending registration, for the pill and the "more" line.
 *   loading / error
 *   onApprove(row)   Opens the confirm dialog.
 */
export function PendingApprovalsCard({ rows = [], count, loading = false, error = null, onApprove }) {
  const isEmpty = loading || error || rows.length === 0;
  const more = count != null ? count - rows.length : 0;

  return (
    <Card className="h-full gap-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserRoundCheck aria-hidden className="size-4 text-muted-foreground" />
          Awaiting your approval
          <Badge variant="secondary" className="tabular-nums">
            {count != null ? formatCount(count) : "—"}
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
                loadingLabel="Loading pending registrations..."
                className="text-xs"
              />
            ) : (
              // The empty queue: an icon over a small line (Adrian).
              <>
                <span
                  aria-hidden
                  className="inline-flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground"
                >
                  <Inbox className="size-5" />
                </span>
                <span className="text-xs text-muted-foreground">Nothing is waiting for your decision.</span>
              </>
            )}
          </div>
        ) : (
          <>
            <ul className="flex flex-col">
              {rows.map((row) => (
                <li key={row.userId} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <div className="truncate text-sm">
                      <span className="font-medium">{row.fullName ?? row.userCode ?? "—"}</span>
                      {row.employeeNo ? (
                        <span className="text-muted-foreground"> · {row.employeeNo}</span>
                      ) : null}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {row.place ?? "No group or branch on record"} · {formatDate(row.createdAt)}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onApprove(row)}
                    className="shrink-0 bg-[#00bb7c] text-xs text-white hover:bg-[#00bb7c]/90"
                  >
                    <CircleCheck data-icon="inline-start" />
                    Approve
                  </Button>
                </li>
              ))}
            </ul>
            {more > 0 ? (
              <p className="mt-auto pt-2 text-xs text-muted-foreground">
                {formatCount(more)} more in the table below
              </p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
