import { useMutation } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/authContext'

export const useSignOutMutation = () => {
  const { signOut } = useAuth()

  return useMutation({
    mutationFn: signOut,
  })
}
