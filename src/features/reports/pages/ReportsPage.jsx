import { useState } from 'react'

import { NotBuiltYet } from '@/app/NotBuiltYet'
import { DATE_PRESET } from '@/constants/presets'
import { ROLES } from '@/constants/roles'
import { useAuth } from '@/features/auth/AuthContext'
import { useBranches, useGroups, useRegions } from '@/features/lookups/hooks'

import { StatusReport } from '../components/StatusReport'
import { useExportReferrals, useReportSummary } from '../hooks'
import { REPORT_LEVELS, buildReportRows } from '../reportData'

/**
 * GET /reports -- referrals by status, drilled place by place.
 *
 * Built for the tenant heads first (Adrian, 2026-09-14): the Department Head
 * walks PhilLife Region -> Group -> Account Officer, the Sector Head walks
 * Landbank Group -> Branch. Everyone else still sees the scaffold.
 */
export function ReportsPage() {
  const { user } = useAuth()

  if (user?.role === ROLES.DEPARTMENT_HEAD) return <TenantReport tenantName="PhilLife" />
  if (user?.role === ROLES.SECTOR_HEAD) return <TenantReport tenantName="Landbank" />

  return (
    <NotBuiltYet
      title="Reports"
      note="Built for the Department Head and Sector Head; the other roles are not yet."
      endpoints={['GET /reports/summary', 'GET /reports/export']}
    />
  )
}

/**
 * One tenant's drill-down. The period and the path live here because each
 * changes the one /reports/summary call behind the table.
 *
 * Every level is `groupBy=<level>` with the last place drilled into as its
 * parent. Where a lookup lists every place at a level, the table starts from
 * it so an empty place shows at 0 (backend F1):
 *   Regions (PhilLife top)        /lookups/regions
 *   Groups  (Landbank top)        /lookups/groups
 *   Branches (under a group)      /lookups/branches?groupCode=
 * A region's groups and a group's Account Officers have no lookup, so those
 * tables are the summary rows only.
 */
function TenantReport({ tenantName }) {
  const levels = REPORT_LEVELS[tenantName]
  const [preset, setPreset] = useState(DATE_PRESET.ALL_TIME)
  const [path, setPath] = useState([])

  const level = levels[path.length]
  const parent = path.at(-1) ?? null
  const canDrill = path.length < levels.length - 1

  const summary = useReportSummary({
    groupBy: level.groupBy,
    preset,
    ...(level.parentParam ? { [level.parentParam]: parent.code } : {}),
  })

  const regionsLookup = useRegions({ enabled: level.groupBy === 'REGION' })
  const groupsLookup = useGroups({ enabled: tenantName === 'Landbank' && level.groupBy === 'AREA' })
  const branchesLookup = useBranches(level.groupBy === 'BRANCH' ? parent?.code : null)

  let lookup = null
  let lookupQuery = null
  if (level.groupBy === 'REGION') {
    lookupQuery = regionsLookup
    lookup = regionsLookup.data?.map((r) => ({ code: r.RegionCode, name: r.RegionName }))
  } else if (tenantName === 'Landbank' && level.groupBy === 'AREA') {
    lookupQuery = groupsLookup
    lookup = groupsLookup.data?.map((g) => ({ code: g.GroupCode, name: g.GroupName }))
  } else if (level.groupBy === 'BRANCH') {
    lookupQuery = branchesLookup
    lookup = branchesLookup.data?.map((b) => ({ code: b.BranchCode, name: b.BranchName }))
  }

  const rows = buildReportRows(summary.data?.rows, lookup ?? null)

  const pending = (query) => Boolean(query) && query.isPending && query.fetchStatus !== 'idle'
  const exportReferrals = useExportReferrals()

  return (
    <StatusReport
      tenantName={tenantName}
      level={level}
      path={path}
      canDrill={canDrill}
      rows={rows}
      preset={preset}
      onPresetChange={setPreset}
      onDrill={(row) => {
        if (canDrill) setPath([...path, { code: row.code, name: row.name }])
      }}
      onCrumb={(index) => setPath(path.slice(0, index + 1))}
      // While a new level or period loads, the previous rows are placeholder
      // data -- a Regions table would sit under a Groups heading. Show loading.
      loading={pending(summary) || pending(lookupQuery) || (summary.isPlaceholderData && summary.isFetching)}
      error={summary.error ?? lookupQuery?.error ?? null}
      onExport={(exportPreset) => exportReferrals.mutate({ preset: exportPreset })}
      isExporting={exportReferrals.isPending}
      exportError={exportReferrals.error}
    />
  )
}