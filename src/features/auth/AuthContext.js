import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)

/**
 * The session.
 *
 * `user` is whatever GET /users/scope answered -- userId, userCode, role,
 * tenant, reach, scopes, branches. It is the ONLY source of role and scope in
 * this app; nothing caches them across a reload.
 *
 * `profile` is the display-only cache (name, avatar) from lib/session.js. It
 * can be null while `user` is perfectly valid. Render without it.
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>.')
  }
  return context
}
