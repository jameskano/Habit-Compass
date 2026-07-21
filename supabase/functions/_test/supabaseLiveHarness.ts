import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'

type LocalSupabaseStatus = {
  ANON_KEY: string
  API_URL: string
  FUNCTIONS_URL: string
  SERVICE_ROLE_KEY: string
}

export type LiveUserSession = {
  accessToken: string
  email: string
  password: string
  user: User
  userClient: SupabaseClient
}

export type ServedFunction = {
  close: () => Promise<void>
  getOutput: () => string
}

const repoRoot = process.cwd()
const pnpmBin = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'

class UnusedWebSocketTransport {
  readonly CLOSED = 3
  readonly CLOSING = 2
  readonly CONNECTING = 0
  readonly OPEN = 1
  readonly protocol = ''
  readonly readyState = this.CLOSED
  readonly url: string
  onclose: ((this: unknown, ev: CloseEvent) => unknown) | null = null
  onerror: ((this: unknown, ev: Event) => unknown) | null = null
  onmessage: ((this: unknown, ev: MessageEvent) => unknown) | null = null
  onopen: ((this: unknown, ev: Event) => unknown) | null = null

  constructor(address: string | URL) {
    this.url = String(address)
  }

  close() {
    // Realtime is not used by these Node integration tests.
  }

  send() {
    throw new Error(
      'Realtime WebSocket transport is not available in live Supabase function tests.',
    )
  }

  addEventListener() {
    // Realtime is not used by these Node integration tests.
  }

  removeEventListener() {
    // Realtime is not used by these Node integration tests.
  }
}

const runCommand = async (command: string, args: string[]) =>
  new Promise<{ stderr: string; stdout: string }>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      shell: process.platform === 'win32',
      windowsHide: true,
    })
    let stderr = ''
    let stdout = ''

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8')
    })
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8')
    })
    child.once('error', reject)
    child.once('close', (code) => {
      if (code === 0) {
        resolve({ stderr, stdout })
        return
      }

      reject(
        new Error(
          `${command} ${args.join(' ')} exited with code ${code ?? 'unknown'}.\n${stdout}\n${stderr}`,
        ),
      )
    })
  })

const extractJsonObject = (output: string) => {
  const start = output.indexOf('{')
  const end = output.lastIndexOf('}')

  if (start < 0 || end < start) {
    throw new Error(`Supabase status did not include JSON output: ${output}`)
  }

  return output.slice(start, end + 1)
}

export const getLocalSupabaseStatus = async (): Promise<LocalSupabaseStatus> => {
  const { stdout, stderr } = await runCommand(pnpmBin, [
    'exec',
    'supabase',
    'status',
    '--output',
    'json',
  ])
  const parsed = JSON.parse(
    extractJsonObject(`${stdout}\n${stderr}`),
  ) as Partial<LocalSupabaseStatus>

  if (!parsed.API_URL || !parsed.FUNCTIONS_URL || !parsed.ANON_KEY || !parsed.SERVICE_ROLE_KEY) {
    throw new Error('Local Supabase status is missing API, function, anon, or service role data.')
  }

  return {
    ANON_KEY: parsed.ANON_KEY,
    API_URL: parsed.API_URL,
    FUNCTIONS_URL: parsed.FUNCTIONS_URL,
    SERVICE_ROLE_KEY: parsed.SERVICE_ROLE_KEY,
  }
}

export const createServiceClient = (status: LocalSupabaseStatus) =>
  createClient(status.API_URL, status.SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    realtime: {
      transport: UnusedWebSocketTransport,
    },
  })

export const createConfirmedPasswordUser = async (
  status: LocalSupabaseStatus,
  email: string,
  password: string,
): Promise<LiveUserSession> => {
  const serviceClient = createServiceClient(status)
  const { data: createdUser, error: createError } = await serviceClient.auth.admin.createUser({
    email,
    email_confirm: true,
    password,
  })

  if (createError || !createdUser.user) {
    throw new Error(`Could not create local Auth user: ${createError?.message ?? 'missing user'}`)
  }

  const userClient = createClient(status.API_URL, status.ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    realtime: {
      transport: UnusedWebSocketTransport,
    },
  })
  const { data: signInData, error: signInError } = await userClient.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError || !signInData.session?.access_token || !signInData.user) {
    throw new Error(
      `Could not sign in local Auth user: ${signInError?.message ?? 'missing session'}`,
    )
  }

  const { error: provisionError } = await userClient.rpc('ensure_user_provisioned')
  if (provisionError) {
    throw new Error(`Could not provision local Auth user: ${provisionError.message}`)
  }

  return {
    accessToken: signInData.session.access_token,
    email,
    password,
    user: signInData.user,
    userClient,
  }
}

export const startDeleteAccountFunction = async (
  status: LocalSupabaseStatus,
  revenueCatApiBaseUrl: string,
): Promise<ServedFunction> => {
  const tempDir = await mkdtemp(join(tmpdir(), 'habit-compass-delete-account-'))
  const envFile = join(tempDir, 'edge-function.env')
  await writeFile(
    envFile,
    [
      `ACCOUNT_DELETION_SUPABASE_ANON_KEY=${status.ANON_KEY}`,
      `ACCOUNT_DELETION_SUPABASE_SERVICE_ROLE_KEY=${status.SERVICE_ROLE_KEY}`,
      'REVENUECAT_SECRET_API_KEY=fake-revenuecat-secret',
      `REVENUECAT_API_BASE_URL=${revenueCatApiBaseUrl}`,
      'ACCOUNT_DELETION_REAUTH_MAX_AGE_SECONDS=600',
    ].join('\n'),
    'utf8',
  )

  const child = spawn(pnpmBin, ['exec', 'supabase', 'functions', 'serve', '--env-file', envFile], {
    cwd: repoRoot,
    shell: process.platform === 'win32',
    windowsHide: true,
  })
  const output = captureProcessOutput(child)

  try {
    await waitForFunctionReadiness(status, child, output)
  } catch (error) {
    await stopProcess(child)
    await rm(tempDir, { force: true, recursive: true })
    throw error
  }

  return {
    close: async () => {
      await stopProcess(child)
      await rm(tempDir, { force: true, recursive: true })
    },
    getOutput: output,
  }
}

const captureProcessOutput = (child: ChildProcessWithoutNullStreams) => {
  let output = ''
  child.stdout.on('data', (chunk: Buffer) => {
    output += chunk.toString('utf8')
  })
  child.stderr.on('data', (chunk: Buffer) => {
    output += chunk.toString('utf8')
  })
  return () => output
}

const waitForFunctionReadiness = async (
  status: LocalSupabaseStatus,
  child: ChildProcessWithoutNullStreams,
  getOutput: () => string,
) => {
  await new Promise((resolve) => setTimeout(resolve, 5_000))

  const deadline = Date.now() + 45_000
  const url = `${status.FUNCTIONS_URL}/delete-account`

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`supabase functions serve exited early.\n${getOutput()}`)
    }

    try {
      const response = await fetch(url, {
        headers: {
          apikey: status.ANON_KEY,
        },
        method: 'OPTIONS',
      })

      if (![404, 502, 503].includes(response.status)) {
        return
      }
    } catch {
      // Keep polling until the gateway and function runtime are ready.
    }

    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  throw new Error(`Timed out waiting for delete-account function readiness.\n${getOutput()}`)
}

const stopProcess = async (child: ChildProcessWithoutNullStreams) => {
  if (child.exitCode !== null) {
    return
  }

  if (process.platform === 'win32' && child.pid) {
    await runCommand('taskkill', ['/PID', String(child.pid), '/T', '/F']).catch(() => undefined)
    return
  }

  child.kill('SIGTERM')
  await new Promise<void>((resolve) => {
    const timeout = setTimeout(resolve, 5_000)
    child.once('exit', () => {
      clearTimeout(timeout)
      resolve()
    })
  })

  if (child.exitCode === null) {
    child.kill('SIGKILL')
  }
}

export const deleteAuthUserIfPresent = async (serviceClient: SupabaseClient, userId: string) => {
  const { data } = await serviceClient.auth.admin.getUserById(userId)
  if (data.user) {
    await serviceClient.auth.admin.deleteUser(userId, false)
  }
}
