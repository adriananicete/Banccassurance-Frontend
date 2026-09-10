import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'

import { queryClient } from '@/lib/queryClient'
import { AuthProvider } from '@/features/auth/AuthProvider'

/**
 * Order matters: AuthProvider runs a query, so it has to sit inside the
 * QueryClientProvider.
 *
 * The TanStack Query devtools panel is deliberately not mounted -- it puts a
 * floating badge in the corner during development. `@tanstack/react-query-
 * devtools` is still installed, so bringing it back while debugging a cache or
 * a refetch is two lines:
 *
 *   import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
 *   {import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={false} /> : null}
 *
 * It never reached the production build either way -- the DEV guard stripped it.
 */
export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </AuthProvider>
    </QueryClientProvider>
  )
}
