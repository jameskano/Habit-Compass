import type { Task } from '../types'

const priorityRank = {
  low: 0,
  medium: 1,
  high: 2,
} as const

const statusRank = (task: Task) => {
  return task.completionStatus === 'pending' ? 0 : 1
}

export const compareTasks = (left: Task, right: Task) => {
  const statusDifference = statusRank(left) - statusRank(right)
  if (statusDifference !== 0) {
    return statusDifference
  }

  if (left.dueDate && !right.dueDate) {
    return -1
  }
  if (!left.dueDate && right.dueDate) {
    return 1
  }
  if (left.dueDate && right.dueDate && left.dueDate !== right.dueDate) {
    return left.dueDate.localeCompare(right.dueDate)
  }

  const priorityDifference = priorityRank[right.priority] - priorityRank[left.priority]
  if (priorityDifference !== 0) {
    return priorityDifference
  }

  const createdDifference = left.createdAt.localeCompare(right.createdAt)
  return createdDifference !== 0 ? createdDifference : left.id.localeCompare(right.id)
}

export const sortTasks = (tasks: readonly Task[]) => {
  return [...tasks].sort(compareTasks)
}
