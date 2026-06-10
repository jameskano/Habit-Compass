export const mockAppShellData = {
  today: {
    greetingName: 'Ari',
    habitsDueCount: 3,
    habitsCompletedCount: 2,
    tasksDueCount: 4,
    tasksCompletedCount: 2,
    completionCompleted: 4,
    completionTotal: 7,
  },
  week: {
    focusCount: 3,
    prioritiesCount: 4,
    categoriesNeedingAttention: 2,
  },
  items: {
    habits: [
      { id: 'habit-1', titleId: 'mock.items.habit.walk', metaId: 'mock.items.habit.walkMeta' },
      { id: 'habit-2', titleId: 'mock.items.habit.read', metaId: 'mock.items.habit.readMeta' },
    ],
    tasks: [
      { id: 'task-1', titleId: 'mock.items.task.pay', metaId: 'mock.items.task.payMeta' },
      { id: 'task-2', titleId: 'mock.items.task.call', metaId: 'mock.items.task.callMeta' },
    ],
    recurrent: [
      {
        id: 'rec-1',
        titleId: 'mock.items.recurrent.review',
        metaId: 'mock.items.recurrent.reviewMeta',
      },
      {
        id: 'rec-2',
        titleId: 'mock.items.recurrent.plants',
        metaId: 'mock.items.recurrent.plantsMeta',
      },
    ],
  },
  mood: {
    historyCount: 5,
  },
} as const
