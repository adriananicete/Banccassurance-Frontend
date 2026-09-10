/** Every route path in one place, so a link and its route cannot drift apart. */
export const paths = {
  login: '/login',
  loginVerify: '/login/verify',
  register: '/register',

  home: '/',

  referrals: '/referrals',
  referralDetail: (id) => `/referrals/${id}`,
  referralNew: '/referrals/new',

  approvals: '/approvals',
  people: '/people',
  profile: '/profile',

  dashboard: '/dashboard',
  reports: '/reports',

  notifications: '/notifications',
  messages: '/messages',
  audit: '/audit',

  forbidden: '/forbidden',
}
