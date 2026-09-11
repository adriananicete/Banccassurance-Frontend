import { NotBuiltYet } from '@/app/NotBuiltYet'
import { ROLES } from '@/constants/roles'
import { useAuth } from '@/features/auth/AuthContext'

import { DepartmentHeadDashboard } from '../components/DepartmentHeadDashboard'

/**
 * One route, nine roles, and the screens are not the same screen.
 *
 * A Department Head reads regional output; an Account Officer works a queue of
 * their own referrals. Those are different questions, so this container picks
 * the component rather than one component branching nine ways internally.
 * Roles whose dashboard is not designed yet still get the scaffolding, so the
 * route never 404s and it stays obvious which ones are left.
 *
 * ⚠️ THE DATA BELOW IS HARDCODED. Nothing here calls the API yet -- it exists
 * so the design can be built against something that looks real. When
 * GET /reports/dashboard is wired, it replaces PLACEHOLDER and the
 * presentational components do not change.
 */
export function DashboardPage() {
  const { user } = useAuth()

  if (user?.role === ROLES.DEPARTMENT_HEAD) {
    return <DepartmentHeadDashboard {...PLACEHOLDER} />
  }

  return (
    <NotBuiltYet
      title="Dashboard"
      note="One call, fixed shape, no parameters — it is always all time, because one of the two procedures behind it takes no date. The Department Head's view is built; the other seven are not."
      endpoints={['GET /reports/dashboard']}
    />
  )
}

/**
 * Stand-in for the response, shaped the way the real one will be read.
 *
 * The three regions are the three rows `banc.regions` actually holds. Each one
 * carries its own `monthly` set for the bar chart, and each set sums exactly to
 * that region's `total` -- 310, 295, 242 -- which themselves sum to 847. Keep it
 * that way when editing: a breakdown that does not add up to the figure beside
 * it is the first thing anyone checks.
 *
 * The Regional Sales Head names are invented -- and note they do NOT come from
 * GET /reports/dashboard, whose breakdown is grouped by region rather than by
 * person. Wiring them up needs a second source, which is why the component
 * treats `headName` as nullable.
 *
 * ⚠️ `monthly` IS THE PART WITH NO SOURCE AT ALL. The region totals are real
 * shapes the API can answer; a split by month is not. `/reports/dashboard` takes
 * no dates, and `/reports/summary` takes a range but groups by
 * REGION / AREA / BRANCH / AO -- never by month. Filling this is a DBA change.
 */
const PLACEHOLDER = {
  total: 847,
  regions: [
    {
      code: 'NCR',
      name: 'NCR',
      total: 310,
      headName: 'Juan Cruz',
      headUserCode: 'PHL-RSH-00001',
      // Sums to 310.
      monthly: [
        { month: 'January', desktop: 40 },
        { month: 'February', desktop: 45 },
        { month: 'March', desktop: 50 },
        { month: 'April', desktop: 55 },
        { month: 'May', desktop: 60 },
        { month: 'June', desktop: 60 },
      ],
    },
    {
      code: 'LUZ',
      name: 'Luzon',
      total: 295,
      headName: 'Ana Reyes',
      headUserCode: 'PHL-RSH-00002',
      // Sums to 295.
      monthly: [
        { month: 'January', desktop: 40 },
        { month: 'February', desktop: 45 },
        { month: 'March', desktop: 48 },
        { month: 'April', desktop: 52 },
        { month: 'May', desktop: 55 },
        { month: 'June', desktop: 55 },
      ],
    },
    {
      code: 'VISMIN',
      name: 'VisMin',
      total: 242,
      headName: null,
      headUserCode: null,
      // Sums to 242.
      monthly: [
        { month: 'January', desktop: 30 },
        { month: 'February', desktop: 35 },
        { month: 'March', desktop: 40 },
        { month: 'April', desktop: 42 },
        { month: 'May', desktop: 45 },
        { month: 'June', desktop: 50 },
      ],
    },
  ],
  pendingApprovals: 1,
  unassignedHeads: 2,
}
