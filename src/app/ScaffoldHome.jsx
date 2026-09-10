import { useAuth } from '@/features/auth/AuthContext'
import { useLogout } from '@/features/auth/hooks'
import { REACH, ROLE_LABELS } from '@/constants/roles'

/**
 * ============================================================================
 *  SCAFFOLDING. Delete this once the app shell exists.
 * ============================================================================
 *
 * It proves the foundation works and is genuinely useful while building: it
 * renders exactly what GET /users/scope answered, which is the only thing that
 * decides what this account can see and do.
 *
 * The `reach` line is the one to read first. An empty `scopes` array means two
 * opposite things: a Sector Head holds the entire tenant with `TENANT`, while
 * an Account Officer with `ASSIGNED` and no rows holds nothing at all and
 * cannot create a referral until an Area Sales Head assigns them branches.
 */
export function ScaffoldHome() {
  const { user, profile } = useAuth()
  const logoutMutation = useLogout()

  const holdsNothing = user?.reach === REACH.ASSIGNED && (user?.scopes?.length ?? 0) === 0

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{profile?.fullName ?? user?.userCode}</h1>
          <p className="text-sm text-muted-foreground">
            {ROLE_LABELS[user?.role] ?? user?.role} · {user?.userCode} · {user?.tenant ?? 'no tenant'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          className="rounded-md border border-input px-3 py-2 text-sm disabled:opacity-50"
        >
          {logoutMutation.isPending ? 'Signing out…' : 'Sign out'}
        </button>
      </header>

      {holdsNothing ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          This account has been approved but holds no scope yet, so it cannot work. Someone at the
          tier above has to assign it.
        </p>
      ) : null}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">reach: {user?.reach}</h2>
        <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs">
          {JSON.stringify(user, null, 2)}
        </pre>
      </section>
    </div>
  )
}
