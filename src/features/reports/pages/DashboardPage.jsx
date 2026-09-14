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
 * The three regions are the three rows `banc.regions` actually holds. EVERY
 * BREAKDOWN HERE ADDS UP, and must keep adding up when edited -- a breakdown
 * that disagrees with the figure beside it is the first thing anyone checks:
 *
 *   region totals     310 + 295 + 242 = 847
 *   region approved    96 +  78 +  88 = 262
 *   region stalled     12 +  31 +   6 =  49
 *   each region's `monthly` sums to that region's total and approved
 *   the tenant `monthly` is the three regions' months added together
 *   each region's `groups` add up to that region -- totals, approved, and
 *   every month
 *
 * Groups are the tier under a region, each held by an Area Sales Head. One
 * head (Maria Santos) holds two NCR groups, which is ordinary -- an Area Sales
 * Head may hold several. SOUTH LUZON has no head, on purpose, to show the gap.
 * Group codes 1-3 and their names are the real seeded ones; 4-8 are invented.
 *
 * The series covers April to September 2026 and nothing before it, which is
 * what lets it sum to an all-time total: it stands for a system that went live
 * in April.
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
  /*
    The outcome half. 262 of 847 is 31%.

    Deliberately NOT in volume order: VisMin is the smallest region and the best
    at closing, NCR is the biggest and middling. That is the whole argument for
    ranking the panel by conversion -- in volume order the worst performer sits
    at the bottom where nobody looks.
  */
  approved: 262,
  /** Referrals with no status change in `stalledDays`. */
  stalled: 49,
  stalledDays: 14,
  // The three regions below, month by month, added together.
  monthly: [
    { month: '2026-04', referrals: 110, approved: 33 },
    { month: '2026-05', referrals: 125, approved: 37 },
    { month: '2026-06', referrals: 138, approved: 41 },
    { month: '2026-07', referrals: 149, approved: 46 },
    { month: '2026-08', referrals: 160, approved: 51 },
    { month: '2026-09', referrals: 165, approved: 54 },
  ],
  regions: [
    {
      code: 'NCR',
      name: 'NCR',
      total: 310,
      approved: 96,
      stalled: 12,
      headName: 'Juan Cruz',
      headUserCode: 'PHL-RSH-00001',
      // No real uploads to point at, so every head shows initials for now.
      // Wired, this is avatarUrl(photo) from lib/apiClient.js.
      headAvatarSrc: null,
      groups: [
        {
          code: 1,
          name: 'CENTRAL NCR',
          total: 127,
          approved: 46,
          headName: 'Maria Santos',
          headUserCode: 'PHL-ASH-00001',
          headAvatarSrc: null,
          monthly: [
            { month: '2026-04', referrals: 16, approved: 6 },
            { month: '2026-05', referrals: 19, approved: 7 },
            { month: '2026-06', referrals: 21, approved: 7 },
            { month: '2026-07', referrals: 23, approved: 8 },
            { month: '2026-08', referrals: 24, approved: 9 },
            { month: '2026-09', referrals: 24, approved: 9 },
          ],
        },
        {
          code: 2,
          name: 'NORTH NCR',
          total: 107,
          approved: 29,
          headName: 'Maria Santos',
          headUserCode: 'PHL-ASH-00001',
          headAvatarSrc: null,
          monthly: [
            { month: '2026-04', referrals: 14, approved: 3 },
            { month: '2026-05', referrals: 15, approved: 4 },
            { month: '2026-06', referrals: 17, approved: 5 },
            { month: '2026-07', referrals: 19, approved: 5 },
            { month: '2026-08', referrals: 21, approved: 6 },
            { month: '2026-09', referrals: 21, approved: 6 },
          ],
        },
        {
          code: 3,
          name: 'SOUTH NCR',
          total: 76,
          approved: 21,
          headName: 'Paolo Reyes',
          headUserCode: 'PHL-ASH-00002',
          headAvatarSrc: null,
          monthly: [
            { month: '2026-04', referrals: 10, approved: 3 },
            { month: '2026-05', referrals: 11, approved: 3 },
            { month: '2026-06', referrals: 12, approved: 3 },
            { month: '2026-07', referrals: 13, approved: 4 },
            { month: '2026-08', referrals: 15, approved: 4 },
            { month: '2026-09', referrals: 15, approved: 4 },
          ],
        },
      ],
      monthly: [
        { month: '2026-04', referrals: 40, approved: 12 },
        { month: '2026-05', referrals: 45, approved: 14 },
        { month: '2026-06', referrals: 50, approved: 15 },
        { month: '2026-07', referrals: 55, approved: 17 },
        { month: '2026-08', referrals: 60, approved: 19 },
        { month: '2026-09', referrals: 60, approved: 19 },
      ],
    },
    {
      code: 'LUZ',
      name: 'Luzon',
      total: 295,
      approved: 78,
      stalled: 31,
      headName: 'Ana Reyes',
      headUserCode: 'PHL-RSH-00002',
      headAvatarSrc: null,
      groups: [
        {
          code: 4,
          name: 'NORTH LUZON',
          total: 91,
          approved: 30,
          headName: 'Liza Garcia',
          headUserCode: 'PHL-ASH-00003',
          headAvatarSrc: null,
          monthly: [
            { month: '2026-04', referrals: 12, approved: 4 },
            { month: '2026-05', referrals: 14, approved: 4 },
            { month: '2026-06', referrals: 15, approved: 5 },
            { month: '2026-07', referrals: 16, approved: 5 },
            { month: '2026-08', referrals: 17, approved: 6 },
            { month: '2026-09', referrals: 17, approved: 6 },
          ],
        },
        {
          code: 5,
          name: 'CENTRAL LUZON',
          total: 118,
          approved: 31,
          headName: 'Ramon Dela Cruz',
          headUserCode: 'PHL-ASH-00004',
          headAvatarSrc: null,
          monthly: [
            { month: '2026-04', referrals: 16, approved: 4 },
            { month: '2026-05', referrals: 18, approved: 5 },
            { month: '2026-06', referrals: 19, approved: 4 },
            { month: '2026-07', referrals: 21, approved: 6 },
            { month: '2026-08', referrals: 22, approved: 6 },
            { month: '2026-09', referrals: 22, approved: 6 },
          ],
        },
        {
          code: 6,
          name: 'SOUTH LUZON',
          total: 86,
          approved: 17,
          headName: null,
          headUserCode: null,
          headAvatarSrc: null,
          monthly: [
            { month: '2026-04', referrals: 12, approved: 2 },
            { month: '2026-05', referrals: 13, approved: 2 },
            { month: '2026-06', referrals: 14, approved: 3 },
            { month: '2026-07', referrals: 15, approved: 3 },
            { month: '2026-08', referrals: 16, approved: 3 },
            { month: '2026-09', referrals: 16, approved: 4 },
          ],
        },
      ],
      monthly: [
        { month: '2026-04', referrals: 40, approved: 10 },
        { month: '2026-05', referrals: 45, approved: 11 },
        { month: '2026-06', referrals: 48, approved: 12 },
        { month: '2026-07', referrals: 52, approved: 14 },
        { month: '2026-08', referrals: 55, approved: 15 },
        { month: '2026-09', referrals: 55, approved: 16 },
      ],
    },
    {
      code: 'VISMIN',
      name: 'VisMin',
      total: 242,
      approved: 88,
      stalled: 6,
      headName: null,
      headUserCode: null,
      headAvatarSrc: null,
      groups: [
        {
          code: 7,
          name: 'VISAYAS',
          total: 136,
          approved: 46,
          headName: 'Grace Villanueva',
          headUserCode: 'PHL-ASH-00005',
          headAvatarSrc: null,
          monthly: [
            { month: '2026-04', referrals: 17, approved: 6 },
            { month: '2026-05', referrals: 20, approved: 6 },
            { month: '2026-06', referrals: 22, approved: 7 },
            { month: '2026-07', referrals: 24, approved: 8 },
            { month: '2026-08', referrals: 25, approved: 9 },
            { month: '2026-09', referrals: 28, approved: 10 },
          ],
        },
        {
          code: 8,
          name: 'MINDANAO',
          total: 106,
          approved: 42,
          headName: 'Jose Bautista',
          headUserCode: 'PHL-ASH-00006',
          headAvatarSrc: null,
          monthly: [
            { month: '2026-04', referrals: 13, approved: 5 },
            { month: '2026-05', referrals: 15, approved: 6 },
            { month: '2026-06', referrals: 18, approved: 7 },
            { month: '2026-07', referrals: 18, approved: 7 },
            { month: '2026-08', referrals: 20, approved: 8 },
            { month: '2026-09', referrals: 22, approved: 9 },
          ],
        },
      ],
      monthly: [
        { month: '2026-04', referrals: 30, approved: 11 },
        { month: '2026-05', referrals: 35, approved: 12 },
        { month: '2026-06', referrals: 40, approved: 14 },
        { month: '2026-07', referrals: 42, approved: 15 },
        { month: '2026-08', referrals: 45, approved: 17 },
        { month: '2026-09', referrals: 50, approved: 19 },
      ],
    },
  ],

}