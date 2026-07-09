import { CalendarRange, ListChecks, Tags } from 'lucide-react'

export const onboardingSlides = [
  {
    bodyId: 'onboarding.slide.today.body',
    icon: ListChecks,
    titleId: 'onboarding.slide.today.title',
    points: [
      'onboarding.slide.today.point.habits',
      'onboarding.slide.today.point.tasks',
      'onboarding.slide.today.point.recurrentTasks',
    ],
  },
  {
    bodyId: 'onboarding.slide.items.body',
    icon: Tags,
    titleId: 'onboarding.slide.items.title',
    points: [
      'onboarding.slide.items.point.manage',
      'onboarding.slide.items.point.archive',
      'onboarding.slide.items.point.categories',
    ],
  },
  {
    bodyId: 'onboarding.slide.week.body',
    icon: CalendarRange,
    titleId: 'onboarding.slide.week.title',
    points: [
      'onboarding.slide.week.point.optional',
      'onboarding.slide.week.point.simple',
      'onboarding.slide.week.point.settings',
    ],
  },
] as const
