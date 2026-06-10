export const calculateCompletionPercentage = (completed: number, total: number) => {
  if (total <= 0) {
    return 0
  }

  return Math.max(0, Math.min(100, (completed / total) * 100))
}
