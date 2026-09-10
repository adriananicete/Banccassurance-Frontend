import { RouterProvider } from 'react-router'

import { Providers } from './app/Providers'
import { router } from './app/router'

function App() {
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  )
}

export default App
