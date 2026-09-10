import { useAuth } from '@/features/auth/AuthContext'
import { REACH } from '@/constants/roles'

/**
 * ============================================================================
 *  SCAFFOLDING. Delete this once the dashboard is built.
 * ============================================================================
 *
 * It renders exactly what GET /users/scope answered, which is the only thing
 * that decides what this account can see and do. That makes it the fastest way
 * to tell a permissions bug from a data one while building Phase 1.
 *
 * The blocking case -- approved but holding nothing -- is announced by the app
 * shell across every screen, so it is not repeated here.
 */
export function ScaffoldHome() {
  const { user } = useAuth()

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Session</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The raw <code className="rounded bg-muted px-1.5 py-0.5 text-xs">GET /users/scope</code>{' '}
          response. Role and scope are re-read from it on every app load — nothing here is cached
          across a reload.
        </p>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        <dt className="text-muted-foreground">reach</dt>
        <dd className="font-medium">
          {user?.reach}
          {user?.reach === REACH.TENANT ? (
            <span className="ml-2 font-normal text-muted-foreground">
              — holds the whole tenant, so the empty arrays below are correct
            </span>
          ) : null}
        </dd>

        <dt className="text-muted-foreground">scopes</dt>
        <dd className="font-medium">{user?.scopes?.length ?? 0}</dd>

        <dt className="text-muted-foreground">branches</dt>
        <dd className="font-medium">{user?.branches?.length ?? 0}</dd>
      </dl>

      <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs">
        {JSON.stringify(user, null, 2)}
      </pre>
    </div>
  )
}
