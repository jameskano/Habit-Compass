export type PeriodProgress = {
  actual: number
  target: number
  remaining: number
  progressRatio: number
  cappedProgressRatio: number
  isComplete: boolean
}

export const calculatePeriodProgress = (actual: number, target: number): PeriodProgress => {
  const safeTarget = target > 0 ? target : 0

  if (safeTarget === 0) {
    return {
      actual,
      target: safeTarget,
      remaining: 0,
      progressRatio: 0,
      cappedProgressRatio: 0,
      isComplete: false,
    }
  }

  const progressRatio = actual / safeTarget

  return {
    actual,
    target: safeTarget,
    remaining: Math.max(0, safeTarget - actual),
    progressRatio,
    cappedProgressRatio: Math.min(progressRatio, 1),
    isComplete: actual >= safeTarget,
  }
}
