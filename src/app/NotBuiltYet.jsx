/**
 * ============================================================================
 *  SCAFFOLDING. Each of these disappears as its screen is built.
 * ============================================================================
 *
 * A routed placeholder that names the screen and the endpoints behind it.
 *
 * The alternative was to leave these paths out of the router entirely, which
 * would answer 404 for a nav item that is visible -- indistinguishable from a
 * broken link. This says plainly that the route is real and the screen is not
 * written yet, and doubles as the build checklist.
 */
export function NotBuiltYet({ title, endpoints = [], note }) {
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">This screen has not been built yet.</p>
      </div>

      {note ? <p className="text-sm text-muted-foreground">{note}</p> : null}

      {endpoints.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">Endpoints it will use</h2>
          <ul className="flex flex-col gap-1">
            {endpoints.map((endpoint) => (
              <li key={endpoint}>
                <code className="rounded bg-muted px-2 py-1 text-xs">{endpoint}</code>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
