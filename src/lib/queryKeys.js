/**
 * Every query key in one place, so an invalidation cannot miss by a typo.
 *
 * Keys are arrays, narrowest last, so a broad invalidation catches the whole
 * subtree: invalidating `['referrals']` also drops every filtered list and
 * every detail under it.
 */
export const queryKeys = {
  /** The session. The authority for role and scope, re-read on every app load. */
  scope: ['scope'],

  lookups: {
    all: ['lookups'],
    regions: ['lookups', 'regions'],
    groups: ['lookups', 'groups'],
    branches: (params) => ['lookups', 'branches', params ?? {}],
    plans: ['lookups', 'plans'],
  },

  referrals: {
    all: ['referrals'],
    list: (params) => ['referrals', 'list', params ?? {}],
    counts: ['referrals', 'counts'],
    detail: (id) => ['referrals', 'detail', id],
    /** GET /referrals/referrer -- takes no parameter, it reads the session. */
    referrer: ['referrals', 'referrer'],
  },

  consent: {
    all: ['consent'],
    /**
     * Keyed by the exact email string. `client@gmail.com` and
     * `client+tag@gmail.com` are the same inbox and two different consents,
     * so they must not share a cache entry.
     */
    check: (email) => ['consent', 'check', email],
  },

  users: {
    all: ['users'],
    /** GET /users?role= -- the Regional or Area Sales Heads. */
    byRole: (role) => ['users', 'by-role', role],
    approvals: (params) => ['users', 'approvals', params ?? {}],
    assignableBranches: (params) => ['users', 'assignable-branches', params ?? {}],
    branches: (userId) => ['users', userId, 'branches'],
    groups: (userId) => ['users', userId, 'groups'],
    region: (userId) => ['users', userId, 'region'],
    checkEmail: (email) => ['users', 'check-email', email],
  },

  reports: {
    all: ['reports'],
    dashboard: ['reports', 'dashboard'],
    summary: (params) => ['reports', 'summary', params ?? {}],
  },

  notifications: {
    all: ['notifications'],
    list: (params) => ['notifications', 'list', params ?? {}],
  },

  messages: {
    all: ['messages'],
    unreadCount: ['messages', 'unread-count'],
    conversations: (params) => ['messages', 'conversations', params ?? {}],
    conversation: (id, params) => ['messages', 'conversations', id, params ?? {}],
    canMessage: (userCode) => ['messages', 'can', userCode],
  },

  audit: {
    all: ['audit'],
    list: (params) => ['audit', 'list', params ?? {}],
  },
}
