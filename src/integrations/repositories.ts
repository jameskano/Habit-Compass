import { mockCategoriesRepository } from './mock/mockCategoriesRepository'
import { mockHabitsRepository } from './mock/mockHabitsRepository'
import { mockMoodRepository } from './mock/mockMoodRepository'
import { mockTasksRepository } from './mock/mockTasksRepository'
import { supabaseCategoriesRepository } from './supabase/repositories/categoriesRepository'
import { supabaseHabitsRepository } from './supabase/repositories/habitsRepository'
import { supabaseMoodRepository } from './supabase/repositories/moodRepository'
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

export const activeRepositorySource = repositorySource
