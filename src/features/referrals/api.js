import { apiClient } from '@/lib/apiClient'

/**
 * GET /referrals -> { rows, pagination }
 *
 * Scoped by the session. Since 2026-09-15 (R11) the Department Head and Sector
 * Head go through the same procedure as every role, so every filter applies to
 * them too.
 *
 *   status              One of the eight, or nothing.
 *   dateFrom / dateTo   `YYYY-MM-DD` Manila days on `CreatedAt`, `dateTo`
 *                       included (F10) -- the same rule as /reports/export, so
 *                       a Preview matches the file. Anything else is silently
 *                       no filter, so send the date input's value as it is.
 */
export async function fetchReferrals({ status, dateFrom, dateTo, search, page, pageSize }) {
  const { data } = await apiClient.get('/referrals', {
    params: {
      status: status || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      search: search || undefined,
      page,
      pageSize,
    },
  })

  return {
    rows: (data.data ?? []).map((row) => ({
      id: row.Id,
      referralNo: row.ReferralNo,
      clientName: [row.FirstName, row.LastName].filter(Boolean).join(' ') || null,
      email: row.Email ?? null,
      branchName: row.BranchName ?? null,
      groupName: row.GroupName ?? null,
      aoName: row.AOName ?? null,
      aoCode: row.AOCode ?? null,
      status: row.Status ?? null,
      createdAt: row.CreatedAt ?? null,
    })),
    pagination: data.pagination ?? null,
  }
}
