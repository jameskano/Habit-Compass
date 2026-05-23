import { RouterProvider } from '@tanstack/react-router'

import { router } from '../router/router'

export function AppRouterProvider() {
  return <RouterProvider router={router} />
}
