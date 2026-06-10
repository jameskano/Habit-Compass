import { RouterProvider } from '@tanstack/react-router'

import { router } from '../router/router'

export const AppRouterProvider = () => {
  return <RouterProvider router={router} />
}
