import { mockCategoriesRepository } from './mock/mockCategoriesRepository'
import { mockFeedbackRepository } from './mock/mockFeedbackRepository'
import { mockHabitsRepository } from './mock/mockHabitsRepository'
import { mockMoodRepository } from './mock/mockMoodRepository'
import { mockPlanningRepository } from './mock/mockPlanningRepository'
import { mockRecurrentTasksRepository } from './mock/mockRecurrentTasksRepository'
import { mockTasksRepository } from './mock/mockTasksRepository'
import { supabaseCategoriesRepository } from './supabase/repositories/categoriesRepository'
import { supabaseFeedbackRepository } from './supabase/repositories/feedbackRepository'
import { supabaseHabitsRepository } from './supabase/repositories/habitsRepository'
import { supabaseMoodRepository } from './supabase/repositories/moodRepository'
import { supabasePlanningRepository } from './supabase/repositories/planningRepository'
import { supabaseRecurrentTasksRepository } from './supabase/repositories/recurrentTasksRepository'
import { supabaseTasksRepository } from './supabase/repositories/tasksRepository'

const repositorySource = import.meta.env.VITE_APP_DATA_SOURCE === 'supabase' ? 'supabase' : 'mock'

export const habitsRepository =
  repositorySource === 'supabase' ? supabaseHabitsRepository : mockHabitsRepository
export const tasksRepository =
  repositorySource === 'supabase' ? supabaseTasksRepository : mockTasksRepository
export const categoriesRepository =
  repositorySource === 'supabase' ? supabaseCategoriesRepository : mockCategoriesRepository
export const moodRepository =
  repositorySource === 'supabase' ? supabaseMoodRepository : mockMoodRepository
export const planningRepository =
  repositorySource === 'supabase' ? supabasePlanningRepository : mockPlanningRepository
export const recurrentTasksRepository =
  repositorySource === 'supabase' ? supabaseRecurrentTasksRepository : mockRecurrentTasksRepository
export const feedbackRepository =
  repositorySource === 'supabase' ? supabaseFeedbackRepository : mockFeedbackRepository

export const activeRepositorySource = repositorySource
