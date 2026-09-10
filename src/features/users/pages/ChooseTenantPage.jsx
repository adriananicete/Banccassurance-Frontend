import landbankLogo from '@/assets/landbank-logo-png_seeklogo-351859.png'
import philLifeLogo from '@/assets/PhilLife-Color.png'
import { paths } from '@/routes/paths'

import { TenantChooser } from '../components/TenantChooser'

/**
 * Step one of registration.
 *
 * The two companies are hardcoded because they are the arrangement itself --
 * bancassurance is one bank selling through one insurer, and there is no
 * endpoint that lists them. `SUPERADMIN` has no entry here on purpose: it is
 * seeded by IT, never registered, and POST /users/register answers 400 for it.
 */
const OPTIONS = [
  {
    slug: 'landbank',
    label: 'Landbank',
    description: 'Branch staff and the heads above them',
    logo: landbankLogo,
    to: paths.registerFor('landbank'),
  },
  {
    slug: 'phillife',
    label: 'PhilLife',
    description: 'Account officers and sales heads',
    logo: philLifeLogo,
    to: paths.registerFor('phillife'),
  },
]

export function ChooseTenantPage() {
  return <TenantChooser options={OPTIONS} />
}
