import { keepPreviousData, useMutation, useQueries, useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/lib/queryKeys'

import { downloadExport, fetchDashboard, fetchSummary } from './api'

export function useReportsDashboard({ enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.reports.dashboard,
    queryFn: fetchDashboard,
    enabled,
  })
}

/**
 * One /reports/summary call. `params` is the whole cache key.
 *
 * `keepPreviousData`: picking a new period or region keeps the figures on
 * screen while the new ones load, instead of blanking every card to a spinner.
 * The spinner is for the first load only.
 */
export function useReportSummary(params, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.reports.summary(params),
    queryFn: () => fetchSummary(params),
    enabled,
    placeholderData: keepPreviousData,
  })
}

/**
 * Several /reports/summary calls at once -- one per region, for the Groups
 * table on "All regions". The API cannot answer AREA for every region in one
 * call with the region attached, so this fans out. Each entry is cached on its
 * own, so picking NCR afterwards reuses NCR's.
 */
export function useReportSummaries(paramsList, { enabled = true } = {}) {
  return useQueries({
    queries: paramsList.map((params) => ({
      queryKey: queryKeys.reports.summary(params),
      queryFn: () => fetchSummary(params),
      enabled,
      placeholderData: keepPreviousData,
    })),
  })
}

export function useExportReferrals() {
  return useMutation({ mutationFn: downloadExport })
}
