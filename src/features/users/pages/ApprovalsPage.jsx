import { useState } from 'react'

import { MEMBERSHIP_ACTION_ROLES } from '@/constants/roles'
import { useBranchesForGroups, useGroups, useRegions } from '@/features/lookups/hooks'
import { useAuth } from '@/features/auth/AuthContext'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'

import { ApprovalsView } from '../components/ApprovalsView'
import { ConfirmApprovalDialog } from '../components/ConfirmApprovalDialog'
import { PendingApprovalsCard } from '../components/PendingApprovalsCard'
import { APPROVAL_ACTION, APPROVAL_STATUS, APPROVES, notifyApproval, placeOf } from '../approvalsUtils'
import {
  useApprovalAction,
  useApprovalCounts,
  useApprovals,
  usePendingApprovals,
} from '../hooks'

/**
 * GET /users/approvals and POST /users/approvals/action, for every approver
 * role. The API scopes the list: each role sees only the tier below it.
 *
 * The status, the search, the page and the confirm dialog live here because
 * each changes a request. Pending is the default -- the queue is the work.
 *
 * An action runs call -> refetch -> toast (FRONTEND_DESIGN_PATTERN.md §12): the
 * mutation's onSuccess waits for every approvals list and count to refetch,
 * then the dialog closes and the toast shows. A refusal stays in the dialog,
 * in the backend's own words.
 */
export function ApprovalsPage() {
  const { user, can } = useAuth()

  const [status, setStatus] = useState(APPROVAL_STATUS.PENDING)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search.trim())
  const [target, setTarget] = useState(null)

  const approvals = useApprovals({ status, search: debouncedSearch })
  const { counts, loading: countsLoading, error: countsError } = useApprovalCounts()
  const action = useApprovalAction()

  // The pending card: the newest five, each with where they registered. Group
  // and region names come from the lookups (public, cached an hour); branch
  // names from one lookup per group that has a branch code in view.
  const pending = usePendingApprovals(5)
  const pendingRows = pending.data?.rows ?? []
  const groups = useGroups()
  const regions = useRegions()
  const branchGroupCodes = [
    ...new Set(
      pendingRows
        .filter((row) => row.branchCode != null && !row.branchName && row.groupCode != null)
        .map((row) => row.groupCode),
    ),
  ]
  const branchLookups = useBranchesForGroups(branchGroupCodes)
  const branches = new Map(
    branchLookups.flatMap((query) =>
      (query.data ?? []).map((branch) => [String(branch.BranchCode), branch.BranchName]),
    ),
  )
  const lookups = { groups: groups.data ?? [], regions: regions.data ?? [], branches }

  const closeDialog = () => {
    setTarget(null)
    action.reset()
  }

  const confirm = () => {
    if (!target) return
    const { row, action: kind } = target
    action.mutate(
      { userId: row.userId, action: kind },
      {
        onSuccess: () => {
          closeDialog()
          notifyApproval(kind, row.fullName ?? row.userCode)
        },
      },
    )
  }

  // Loading is the first load only; a new page or filter keeps the old rows
  // on screen while the next ones arrive.
  const loading = approvals.isPending && approvals.fetchStatus !== 'idle'

  return (
    <>
      <ApprovalsView
        approvesLabel={APPROVES[user?.role] ?? 'people'}
        status={status}
        onStatusChange={setStatus}
        counts={counts}
        countsLoading={countsLoading}
        countsError={countsError}
        search={search}
        onSearchChange={setSearch}
        rows={approvals.rows}
        loading={loading}
        error={approvals.error}
        page={approvals.page}
        totalPages={approvals.totalPages}
        totalCount={approvals.totalCount}
        pageSize={approvals.pageSize}
        onPageChange={approvals.setPage}
        canDeactivate={can(MEMBERSHIP_ACTION_ROLES)}
        onAction={(row, kind) => setTarget({ row, action: kind })}
        pendingSlot={
          <PendingApprovalsCard
            rows={pendingRows.map((row) => ({ ...row, place: placeOf(row, lookups) }))}
            count={counts[APPROVAL_STATUS.PENDING]}
            loading={pending.isPending && pending.fetchStatus !== 'idle'}
            error={pending.error}
            onApprove={(row) => setTarget({ row, action: APPROVAL_ACTION.APPROVE })}
          />
        }
      />
      <ConfirmApprovalDialog
        target={target}
        submitting={action.isPending}
        error={action.error}
        onConfirm={confirm}
        onClose={closeDialog}
      />
    </>
  )
}
