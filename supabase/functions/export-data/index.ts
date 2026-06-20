/* global Deno */
import { createClient } from 'jsr:@supabase/supabase-js@2'

type ExportFormat = 'csv' | 'json'
type Row = Record<string, unknown>
type CsvValue = string | number | boolean | null | undefined | object

const exportSchemaVersion = '1.0.0'
const appName = 'Habit Compass'
const textEncoder = new TextEncoder()

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const csvValueToCell = (value: CsvValue) => {
  if (value === null || value === undefined) {
    return ''
  }

  const stringValue =
    typeof value === 'object'
      ? JSON.stringify(value)
      : typeof value === 'boolean'
        ? value
          ? 'true'
          : 'false'
        : String(value)

  return /[",\r\n]/.test(stringValue) ? `"${stringValue.replaceAll('"', '""')}"` : stringValue
}

const buildCsv = <T>(rows: T[], columns: { header: string; value: (row: T) => CsvValue }[]) => {
  const header = columns.map((column) => csvValueToCell(column.header)).join(',')
  const body = rows.map((row) =>
    columns.map((column) => csvValueToCell(column.value(row))).join(','),
  )

  return [header, ...body].join('\n')
}

const buildFilename = (format: ExportFormat, generatedAt: Date) => {
  const year = generatedAt.getUTCFullYear()
  const month = String(generatedAt.getUTCMonth() + 1).padStart(2, '0')
  const day = String(generatedAt.getUTCDate()).padStart(2, '0')
  const extension = format === 'csv' ? 'zip' : 'json'

  return `habit-compass-export-${year}-${month}-${day}.${extension}`
}

const crcTable = new Uint32Array(256)
for (let index = 0; index < 256; index += 1) {
  let value = index
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
  }
  crcTable[index] = value >>> 0
}

const crc32 = (bytes: Uint8Array) => {
  let value = 0xffffffff
  for (const byte of bytes) {
    value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8)
  }
  return (value ^ 0xffffffff) >>> 0
}

const writeUint16 = (buffer: Uint8Array, offset: number, value: number) => {
  buffer[offset] = value & 0xff
  buffer[offset + 1] = (value >>> 8) & 0xff
}

const writeUint32 = (buffer: Uint8Array, offset: number, value: number) => {
  buffer[offset] = value & 0xff
  buffer[offset + 1] = (value >>> 8) & 0xff
  buffer[offset + 2] = (value >>> 16) & 0xff
  buffer[offset + 3] = (value >>> 24) & 0xff
}

const concatBytes = (chunks: Uint8Array[]) => {
  const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const output = new Uint8Array(length)
  let offset = 0

  for (const chunk of chunks) {
    output.set(chunk, offset)
    offset += chunk.length
  }

  return output
}

const createStoredZip = (entries: { path: string; content: string }[]) => {
  const localFileChunks: Uint8Array[] = []
  const centralDirectoryChunks: Uint8Array[] = []
  let localOffset = 0

  for (const entry of entries) {
    const nameBytes = textEncoder.encode(entry.path)
    const contentBytes = textEncoder.encode(entry.content)
    const checksum = crc32(contentBytes)

    const localHeader = new Uint8Array(30 + nameBytes.length)
    writeUint32(localHeader, 0, 0x04034b50)
    writeUint16(localHeader, 4, 10)
    writeUint16(localHeader, 6, 0)
    writeUint16(localHeader, 8, 0)
    writeUint16(localHeader, 10, 0)
    writeUint16(localHeader, 12, 0)
    writeUint32(localHeader, 14, checksum)
    writeUint32(localHeader, 18, contentBytes.length)
    writeUint32(localHeader, 22, contentBytes.length)
    writeUint16(localHeader, 26, nameBytes.length)
    writeUint16(localHeader, 28, 0)
    localHeader.set(nameBytes, 30)
    localFileChunks.push(localHeader, contentBytes)

    const centralHeader = new Uint8Array(46 + nameBytes.length)
    writeUint32(centralHeader, 0, 0x02014b50)
    writeUint16(centralHeader, 4, 20)
    writeUint16(centralHeader, 6, 10)
    writeUint16(centralHeader, 8, 0)
    writeUint16(centralHeader, 10, 0)
    writeUint16(centralHeader, 12, 0)
    writeUint16(centralHeader, 14, 0)
    writeUint32(centralHeader, 16, checksum)
    writeUint32(centralHeader, 20, contentBytes.length)
    writeUint32(centralHeader, 24, contentBytes.length)
    writeUint16(centralHeader, 28, nameBytes.length)
    writeUint16(centralHeader, 30, 0)
    writeUint16(centralHeader, 32, 0)
    writeUint16(centralHeader, 34, 0)
    writeUint16(centralHeader, 36, 0)
    writeUint32(centralHeader, 38, 0)
    writeUint32(centralHeader, 42, localOffset)
    centralHeader.set(nameBytes, 46)
    centralDirectoryChunks.push(centralHeader)
    localOffset += localHeader.length + contentBytes.length
  }

  const centralDirectory = concatBytes(centralDirectoryChunks)
  const endOfCentralDirectory = new Uint8Array(22)
  writeUint32(endOfCentralDirectory, 0, 0x06054b50)
  writeUint16(endOfCentralDirectory, 4, 0)
  writeUint16(endOfCentralDirectory, 6, 0)
  writeUint16(endOfCentralDirectory, 8, entries.length)
  writeUint16(endOfCentralDirectory, 10, entries.length)
  writeUint32(endOfCentralDirectory, 12, centralDirectory.length)
  writeUint32(endOfCentralDirectory, 16, localOffset)
  writeUint16(endOfCentralDirectory, 20, 0)

  return concatBytes([...localFileChunks, centralDirectory, endOfCentralDirectory])
}

const toStringOrNull = (value: unknown) => (typeof value === 'string' ? value : null)
const toString = (value: unknown) => (typeof value === 'string' ? value : String(value ?? ''))
const toNumber = (value: unknown) => (typeof value === 'number' ? value : Number(value ?? 0))
const toBoolean = (value: unknown) => Boolean(value)
const toObject = (value: unknown) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {}

const readRows = async (
  supabase: ReturnType<typeof createClient>,
  table: string,
  userId: string,
) => {
  const { data, error } = await supabase.from(table).select('*').eq('user_id', userId)
  if (error) {
    throw error
  }

  return (data ?? []) as Row[]
}

const buildExportData = async (supabase: ReturnType<typeof createClient>, userId: string) => {
  const [
    categoryRows,
    habitRows,
    habitInactivityRows,
    taskRows,
    recurrentTaskRows,
    recurrentTaskLogRows,
    habitLogRows,
    moodLogRows,
    reflectionRows,
    weeklyPlanRows,
    weeklyBigRockRows,
  ] = await Promise.all([
    readRows(supabase, 'categories', userId),
    readRows(supabase, 'habits', userId),
    readRows(supabase, 'habit_inactivity_periods', userId),
    readRows(supabase, 'tasks', userId),
    readRows(supabase, 'recurrent_tasks', userId),
    readRows(supabase, 'recurrent_task_logs', userId),
    readRows(supabase, 'habit_logs', userId),
    readRows(supabase, 'mood_logs', userId),
    readRows(supabase, 'reflections', userId),
    readRows(supabase, 'weekly_plans', userId),
    readRows(supabase, 'weekly_big_rocks', userId),
  ])

  return {
    categories: categoryRows.map((row) => ({
      id: toString(row.id),
      name: toString(row.name),
      description: toStringOrNull(row.description),
      colorToken: toString(row.color),
      iconName: toString(row.icon),
      order: toNumber(row.sort_order),
      isDefault: toBoolean(row.is_default),
      defaultKey: null,
      archivedAt: toStringOrNull(row.archived_at),
      createdAt: toString(row.created_at),
      updatedAt: toString(row.updated_at),
    })),
    habits: habitRows.map((row) => {
      const hasCompletionLevels = row.minimum_config !== null || row.standard_config !== null
      return {
        id: toString(row.id),
        categoryId: toStringOrNull(row.category_id),
        title: toString(row.title),
        description: toStringOrNull(row.description),
        notes: toStringOrNull(row.notes),
        lifecycleStatus: row.archived_at ? 'archived' : 'active',
        priority: toString(row.priority),
        startsOn: toString(row.starts_on),
        endsOn: toStringOrNull(row.ends_on),
        order: toNumber(row.sort_order),
        scheduleRule: toObject(row.schedule_config),
        trackingType: toString(row.tracking_type),
        goalConfig: toObject(row.goal_config),
        usesCompletionLevels: hasCompletionLevels,
        enabledCompletionLevels: hasCompletionLevels ? ['minimum', 'standard'] : ['standard'],
        defaultCompletionLevel: hasCompletionLevels ? 'standard' : null,
        resetMode: 'soft',
        archivedAt: toStringOrNull(row.archived_at),
        createdAt: toString(row.created_at),
        updatedAt: toString(row.updated_at),
      }
    }),
    habitInactivityPeriods: habitInactivityRows.map((row) => ({
      id: toString(row.id),
      habitId: toString(row.habit_id),
      reason: toString(row.reason),
      startsOn: toString(row.starts_on),
      resumesOn: toStringOrNull(row.resumes_on),
      createdAt: toString(row.created_at),
      updatedAt: toString(row.updated_at),
    })),
    tasks: taskRows.map((row) => ({
      id: toString(row.id),
      categoryId: toStringOrNull(row.category_id),
      title: toString(row.title),
      description: toStringOrNull(row.description),
      notes: toStringOrNull(row.notes),
      dueDate: toStringOrNull(row.due_date),
      completionStatus: toString(row.status),
      lifecycleStatus: row.archived_at ? 'archived' : 'active',
      priority: toString(row.priority),
      carryForward: toBoolean(row.carry_forward),
      order: toNumber(row.sort_order),
      completedAt: toStringOrNull(row.completed_at),
      archivedAt: toStringOrNull(row.archived_at),
      createdAt: toString(row.created_at),
      updatedAt: toString(row.updated_at),
    })),
    recurrentTasks: recurrentTaskRows.map((row) => ({
      id: toString(row.id),
      categoryId: toStringOrNull(row.category_id),
      title: toString(row.title),
      description: toStringOrNull(row.description),
      notes: toStringOrNull(row.notes),
      lifecycleStatus: row.archived_at ? 'archived' : 'active',
      priority: toString(row.priority),
      startsOn: toString(row.starts_on),
      endsOn: toStringOrNull(row.ends_on),
      recurrenceRule: toObject(row.recurrence_config),
      carryForward: toBoolean(row.carry_forward),
      order: toNumber(row.sort_order),
      archivedAt: toStringOrNull(row.archived_at),
      createdAt: toString(row.created_at),
      updatedAt: toString(row.updated_at),
    })),
    recurrentTaskLogs: recurrentTaskLogRows.map((row) => ({
      id: toString(row.id),
      recurrentTaskId: toString(row.recurrent_task_id),
      scheduledForDate: toString(row.occurrence_date),
      status: toString(row.status),
      completedAt: toStringOrNull(row.completed_at),
      note: toStringOrNull(row.note),
      createdAt: toString(row.created_at),
      updatedAt: toString(row.updated_at),
    })),
    habitLogs: habitLogRows.map((row) => ({
      id: toString(row.id),
      habitId: toString(row.habit_id),
      loggedForDate: toString(row.log_date),
      loggedAt: toString(row.logged_at),
      status: toString(row.status),
      completionLevel: toStringOrNull(row.completion_level),
      repetitions: row.repetitions,
      durationMinutes: row.duration_minutes,
      quantity: row.quantity,
      quantityUnitLabel: toStringOrNull(row.quantity_unit_label),
      notes: toStringOrNull(row.note),
      createdAt: toString(row.created_at),
      updatedAt: toString(row.updated_at),
    })),
    moodLogs: moodLogRows.map((row) => ({
      id: toString(row.id),
      loggedForDate: toString(row.log_date),
      loggedAt: toString(row.created_at),
      mood: toString(row.mood),
      energy: row.energy ?? null,
      stress: row.stress ?? null,
      note: toStringOrNull(row.note),
      createdAt: toString(row.created_at),
      updatedAt: toString(row.updated_at),
    })),
    reflections: reflectionRows.map((row) => ({
      id: toString(row.id),
      kind: toString(row.kind),
      content: toString(row.content),
      recordedForDate: toStringOrNull(row.recorded_for_date),
      weekStartDate: toStringOrNull(row.week_start_date),
      moodLogId: toStringOrNull(row.mood_log_id),
      promptKey: toStringOrNull(row.prompt_key),
      archivedAt: toStringOrNull(row.archived_at),
      deletedAt: toStringOrNull(row.deleted_at),
      createdAt: toString(row.created_at),
      updatedAt: toString(row.updated_at),
    })),
    weeklyRecords: weeklyPlanRows.map((row) => ({
      id: toString(row.id),
      weekStartDate: toString(row.week_start),
      focusText: toStringOrNull(row.focus_text),
      reviewOverallFeeling: toStringOrNull(row.review_overall_feeling),
      reviewWentWell: toStringOrNull(row.review_went_well),
      reviewGotInWay: toStringOrNull(row.review_got_in_way),
      reviewAdjustNextWeek: toStringOrNull(row.review_adjust_next_week),
      reviewReflections: toStringOrNull(row.review_reflections),
      createdAt: toString(row.created_at),
      updatedAt: toString(row.updated_at),
    })),
    weeklyBigRocks: weeklyBigRockRows.map((row) => ({
      id: toString(row.id),
      weeklyPlanId: toString(row.weekly_plan_id),
      habitId: toString(row.habit_id),
      sortOrder: toNumber(row.sort_order),
      archivedAt: toStringOrNull(row.archived_at),
      deletedAt: toStringOrNull(row.deleted_at),
      createdAt: toString(row.created_at),
      updatedAt: toString(row.updated_at),
    })),
  }
}

const buildCsvFiles = (data: Awaited<ReturnType<typeof buildExportData>>) => ({
  'categories.csv': buildCsv(data.categories, [
    { header: 'id', value: (row) => row.id },
    { header: 'name', value: (row) => row.name },
    { header: 'description', value: (row) => row.description },
    { header: 'icon', value: (row) => row.iconName },
    { header: 'color', value: (row) => row.colorToken },
    { header: 'sort_order', value: (row) => row.order },
    { header: 'is_default', value: (row) => row.isDefault },
    { header: 'default_key', value: (row) => row.defaultKey },
    { header: 'created_at', value: (row) => row.createdAt },
    { header: 'updated_at', value: (row) => row.updatedAt },
  ]),
  'habits.csv': buildCsv(data.habits, [
    { header: 'id', value: (row) => row.id },
    { header: 'category_id', value: (row) => row.categoryId },
    { header: 'title', value: (row) => row.title },
    { header: 'description', value: (row) => row.description },
    { header: 'notes', value: (row) => row.notes },
    { header: 'priority', value: (row) => row.priority },
    { header: 'sort_order', value: (row) => row.order },
    { header: 'starts_on', value: (row) => row.startsOn },
    { header: 'ends_on', value: (row) => row.endsOn },
    { header: 'schedule_rule_json', value: (row) => row.scheduleRule },
    { header: 'goal_config_json', value: (row) => row.goalConfig },
    {
      header: 'completion_levels_json',
      value: (row) => ({
        usesCompletionLevels: row.usesCompletionLevels,
        enabledCompletionLevels: row.enabledCompletionLevels,
        defaultCompletionLevel: row.defaultCompletionLevel,
      }),
    },
    { header: 'archived_at', value: (row) => row.archivedAt },
    { header: 'created_at', value: (row) => row.createdAt },
    { header: 'updated_at', value: (row) => row.updatedAt },
  ]),
  'habit_inactivity_periods.csv': buildCsv(data.habitInactivityPeriods, [
    { header: 'id', value: (row) => row.id },
    { header: 'habit_id', value: (row) => row.habitId },
    { header: 'reason', value: (row) => row.reason },
    { header: 'starts_on', value: (row) => row.startsOn },
    { header: 'resumes_on', value: (row) => row.resumesOn },
    { header: 'created_at', value: (row) => row.createdAt },
    { header: 'updated_at', value: (row) => row.updatedAt },
  ]),
  'tasks.csv': buildCsv(data.tasks, [
    { header: 'id', value: (row) => row.id },
    { header: 'category_id', value: (row) => row.categoryId },
    { header: 'title', value: (row) => row.title },
    { header: 'description', value: (row) => row.description },
    { header: 'notes', value: (row) => row.notes },
    { header: 'priority', value: (row) => row.priority },
    { header: 'due_date', value: (row) => row.dueDate },
    { header: 'status', value: (row) => row.completionStatus },
    { header: 'carry_forward', value: (row) => row.carryForward },
    { header: 'sort_order', value: (row) => row.order },
    { header: 'completed_at', value: (row) => row.completedAt },
    { header: 'archived_at', value: (row) => row.archivedAt },
    { header: 'created_at', value: (row) => row.createdAt },
    { header: 'updated_at', value: (row) => row.updatedAt },
  ]),
  'recurrent_tasks.csv': buildCsv(data.recurrentTasks, [
    { header: 'id', value: (row) => row.id },
    { header: 'category_id', value: (row) => row.categoryId },
    { header: 'title', value: (row) => row.title },
    { header: 'description', value: (row) => row.description },
    { header: 'notes', value: (row) => row.notes },
    { header: 'priority', value: (row) => row.priority },
    { header: 'starts_on', value: (row) => row.startsOn },
    { header: 'ends_on', value: (row) => row.endsOn },
    { header: 'recurrence_config_json', value: (row) => row.recurrenceRule },
    { header: 'carry_forward', value: (row) => row.carryForward },
    { header: 'sort_order', value: (row) => row.order },
    { header: 'archived_at', value: (row) => row.archivedAt },
    { header: 'created_at', value: (row) => row.createdAt },
    { header: 'updated_at', value: (row) => row.updatedAt },
  ]),
  'recurrent_task_logs.csv': buildCsv(data.recurrentTaskLogs, [
    { header: 'id', value: (row) => row.id },
    { header: 'recurrent_task_id', value: (row) => row.recurrentTaskId },
    { header: 'occurrence_date', value: (row) => row.scheduledForDate },
    { header: 'status', value: (row) => row.status },
    { header: 'completed_at', value: (row) => row.completedAt },
    { header: 'note', value: (row) => row.note },
    { header: 'created_at', value: (row) => row.createdAt },
    { header: 'updated_at', value: (row) => row.updatedAt },
  ]),
  'completion_logs.csv': buildCsv(data.habitLogs, [
    { header: 'id', value: (row) => row.id },
    { header: 'habit_id', value: (row) => row.habitId },
    { header: 'log_date', value: (row) => row.loggedForDate },
    { header: 'logged_at', value: (row) => row.loggedAt },
    { header: 'status', value: (row) => row.status },
    { header: 'completion_level', value: (row) => row.completionLevel },
    { header: 'duration_minutes', value: (row) => row.durationMinutes },
    { header: 'repetitions', value: (row) => row.repetitions },
    { header: 'quantity', value: (row) => row.quantity },
    { header: 'quantity_unit_label', value: (row) => row.quantityUnitLabel },
    { header: 'note', value: (row) => row.notes },
    { header: 'created_at', value: (row) => row.createdAt },
    { header: 'updated_at', value: (row) => row.updatedAt },
  ]),
  'mood_logs.csv': buildCsv(data.moodLogs, [
    { header: 'id', value: (row) => row.id },
    { header: 'log_date', value: (row) => row.loggedForDate },
    { header: 'mood', value: (row) => row.mood },
    { header: 'energy', value: (row) => row.energy },
    { header: 'stress', value: (row) => row.stress },
    { header: 'note', value: (row) => row.note },
    { header: 'created_at', value: (row) => row.createdAt },
    { header: 'updated_at', value: (row) => row.updatedAt },
  ]),
  'reflections.csv': buildCsv(data.reflections, [
    { header: 'id', value: (row) => row.id },
    { header: 'kind', value: (row) => row.kind },
    { header: 'recorded_for_date', value: (row) => row.recordedForDate },
    { header: 'week_start_date', value: (row) => row.weekStartDate },
    { header: 'mood_log_id', value: (row) => row.moodLogId },
    { header: 'prompt_key', value: (row) => row.promptKey },
    { header: 'content', value: (row) => row.content },
    { header: 'archived_at', value: (row) => row.archivedAt },
    { header: 'deleted_at', value: (row) => row.deletedAt },
    { header: 'created_at', value: (row) => row.createdAt },
    { header: 'updated_at', value: (row) => row.updatedAt },
  ]),
  'weekly_records.csv': buildCsv(data.weeklyRecords, [
    { header: 'id', value: (row) => row.id },
    { header: 'week_start', value: (row) => row.weekStartDate },
    { header: 'focus_text', value: (row) => row.focusText },
    { header: 'review_overall_feeling', value: (row) => row.reviewOverallFeeling },
    { header: 'review_went_well', value: (row) => row.reviewWentWell },
    { header: 'review_got_in_way', value: (row) => row.reviewGotInWay },
    { header: 'review_adjust_next_week', value: (row) => row.reviewAdjustNextWeek },
    { header: 'review_reflections', value: (row) => row.reviewReflections },
    { header: 'created_at', value: (row) => row.createdAt },
    { header: 'updated_at', value: (row) => row.updatedAt },
  ]),
  'weekly_big_rocks.csv': buildCsv(data.weeklyBigRocks, [
    { header: 'id', value: (row) => row.id },
    { header: 'weekly_plan_id', value: (row) => row.weeklyPlanId },
    { header: 'habit_id', value: (row) => row.habitId },
    { header: 'sort_order', value: (row) => row.sortOrder },
    { header: 'archived_at', value: (row) => row.archivedAt },
    { header: 'deleted_at', value: (row) => row.deletedAt },
    { header: 'created_at', value: (row) => row.createdAt },
    { header: 'updated_at', value: (row) => row.updatedAt },
  ]),
})

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    })
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { format?: unknown }
    const format = body.format === 'csv' || body.format === 'json' ? body.format : null

    if (!format) {
      return new Response(JSON.stringify({ error: 'Unsupported export format.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({ error: 'Export service is not configured.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: request.headers.get('Authorization') ?? '' },
      },
    })
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Authentication required.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const generatedAt = new Date()
    const data = await buildExportData(supabase, user.id)
    const filename = buildFilename(format, generatedAt)

    if (format === 'json') {
      return new Response(
        JSON.stringify(
          {
            schemaVersion: exportSchemaVersion,
            generatedAt: generatedAt.toISOString(),
            app: {
              name: appName,
              exportFormat: 'json',
            },
            data,
          },
          null,
          2,
        ),
        {
          headers: {
            ...corsHeaders,
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Type': 'application/json',
          },
        },
      )
    }

    const files = buildCsvFiles(data)
    const zipBytes = createStoredZip(
      Object.entries(files).map(([path, content]) => ({
        path,
        content,
      })),
    )

    return new Response(zipBytes, {
      headers: {
        ...corsHeaders,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': 'application/octet-stream',
      },
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: 'Export could not be generated.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
