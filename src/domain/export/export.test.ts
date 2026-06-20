import { describe, expect, it } from 'vitest'

import { cloneMockState } from '@/integrations/mock/mockData'

import { buildCsvExportFiles, csvValueToCell } from './csv'
import {
  EXPORT_SCHEMA_VERSION,
  buildCsvZipBytes,
  buildExportData,
  buildJsonExport,
} from './transform'

describe('data export transformations', () => {
  it('formats CSV cells without losing commas, quotes, newlines, booleans, nulls, or JSON', () => {
    expect(csvValueToCell('plain')).toBe('plain')
    expect(csvValueToCell('hello, "reader"\nnext')).toBe('"hello, ""reader""\nnext"')
    expect(csvValueToCell(null)).toBe('')
    expect(csvValueToCell(true)).toBe('true')
    expect(csvValueToCell(false)).toBe('false')
    expect(csvValueToCell({ kind: 'daily', days: [1, 2] })).toBe(
      '"{""kind"":""daily"",""days"":[1,2]}"',
    )
  })

  it('builds JSON export data without user IDs or settings/auth records', () => {
    const state = cloneMockState()
    state.habits[0] = {
      ...state.habits[0],
      archivedAt: '2026-01-10T00:00:00.000Z',
      inactivityPeriods: [
        {
          reason: 'archived',
          startsOn: '2026-01-10',
          resumesOn: null,
        },
      ],
    }
    state.weeklyPlans.push({
      id: 'weekly-plan-1',
      userId: 'mock-user-1',
      weekStartDate: '2026-01-05',
      focusText: 'Keep the week stable',
      reviewOverallFeeling: 'good',
      reviewWentWell: null,
      reviewGotInWay: null,
      reviewAdjustNextWeek: null,
      reviewReflections: null,
      createdAt: '2026-01-05T00:00:00.000Z',
      updatedAt: '2026-01-05T00:00:00.000Z',
    })

    const data = buildExportData({
      categories: state.categories,
      habits: state.habits,
      habitLogs: state.habitLogs,
      tasks: state.tasks,
      recurrentTasks: state.recurrentTasks,
      recurrentTaskLogs: state.recurrentTaskOccurrences,
      moodLogs: state.moodLogs,
      reflections: [],
      weeklyRecords: state.weeklyPlans,
      weeklyBigRocks: state.weeklyBigRocks,
    })
    const jsonExport = buildJsonExport(data, new Date('2026-02-03T04:05:06.000Z'))
    const serialized = JSON.stringify(jsonExport)

    expect(jsonExport.schemaVersion).toBe(EXPORT_SCHEMA_VERSION)
    expect(jsonExport.generatedAt).toBe('2026-02-03T04:05:06.000Z')
    expect(jsonExport.data.habits[0].archivedAt).toBe('2026-01-10T00:00:00.000Z')
    expect(jsonExport.data.habitInactivityPeriods).toEqual([
      {
        id: 'habit-move-inactivity-1',
        habitId: 'habit-move',
        reason: 'archived',
        startsOn: '2026-01-10',
        resumesOn: null,
        createdAt: state.habits[0].createdAt,
        updatedAt: state.habits[0].updatedAt,
      },
    ])
    expect(jsonExport.data.weeklyRecords[0].weekStartDate).toBe('2026-01-05')
    expect(serialized).not.toContain('"userId"')
    expect(serialized).not.toContain('"authSession"')
    expect(serialized).not.toContain('"theme"')
    expect(serialized).not.toContain('"weekStartsOn"')
  })

  it('builds CSV files with the expected current schema names', () => {
    const state = cloneMockState()
    const data = buildExportData({
      categories: state.categories,
      habits: state.habits,
      habitLogs: state.habitLogs,
      tasks: state.tasks,
      recurrentTasks: state.recurrentTasks,
      recurrentTaskLogs: state.recurrentTaskOccurrences,
      moodLogs: state.moodLogs,
      reflections: [],
      weeklyRecords: state.weeklyPlans,
      weeklyBigRocks: state.weeklyBigRocks,
    })
    const files = buildCsvExportFiles(data)

    expect(Object.keys(files).sort()).toEqual(
      [
        'categories.csv',
        'completion_logs.csv',
        'habit_inactivity_periods.csv',
        'habits.csv',
        'mood_logs.csv',
        'recurrent_task_logs.csv',
        'recurrent_tasks.csv',
        'reflections.csv',
        'tasks.csv',
        'weekly_big_rocks.csv',
        'weekly_records.csv',
      ].sort(),
    )
    expect(files['weekly_records.csv'].split('\n')[0]).toContain('week_start')
    expect(files['weekly_records.csv'].split('\n')[0]).not.toContain('period_end')
    expect(files['tasks.csv'].split('\n')[0]).toContain('status')
  })

  it('packages CSV files into a ZIP response', () => {
    const state = cloneMockState()
    const data = buildExportData({
      categories: state.categories,
      habits: state.habits,
      habitLogs: state.habitLogs,
      tasks: state.tasks,
      recurrentTasks: state.recurrentTasks,
      recurrentTaskLogs: state.recurrentTaskOccurrences,
      moodLogs: state.moodLogs,
      reflections: [],
      weeklyRecords: state.weeklyPlans,
      weeklyBigRocks: state.weeklyBigRocks,
    })
    const zipText = new TextDecoder().decode(buildCsvZipBytes(data))

    expect(zipText).toContain('categories.csv')
    expect(zipText).toContain('completion_logs.csv')
    expect(zipText).toContain('weekly_records.csv')
  })
})
