/* global Deno */
import { createClient } from 'jsr:@supabase/supabase-js@2'

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const getRequiredEnv = (key: string) => {
  const value = Deno.env.get(key)
  if (!value) {
    throw new Error(`${key} is not configured.`)
  }
  return value
}

const removeFeedbackAttachments = async (
  serviceClient: ReturnType<typeof createClient>,
  userId: string,
) => {
  const { data: attachments, error } = await serviceClient
    .from('feedback_attachments')
    .select('storage_path')
    .eq('user_id', userId)

  if (error || !attachments?.length) {
    return
  }

  const paths = attachments
    .map((attachment) => attachment.storage_path as string | null)
    .filter((path): path is string => Boolean(path))

  if (paths.length > 0) {
    await serviceClient.storage.from('feedback-attachments').remove(paths)
  }
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405)
  }

  try {
    const cronSecret = Deno.env.get('CRON_SECRET')
    if (!cronSecret || request.headers.get('x-cron-secret') !== cronSecret) {
      return jsonResponse({ error: 'Unauthorized.' }, 401)
    }

    const serviceClient = createClient(
      getRequiredEnv('SUPABASE_URL'),
      getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
    )
    const now = new Date().toISOString()
    const { data: dueProfiles, error } = await serviceClient
      .from('profiles')
      .select('id, deletion_finalization_attempts')
      .eq('account_status', 'pending_deletion')
      .lte('deletion_scheduled_for', now)
      .is('deletion_finalization_started_at', null)
      .limit(20)

    if (error) {
      return jsonResponse({ error: 'Due accounts could not be loaded.' }, 500)
    }

    const finalized: string[] = []
    const failed: string[] = []

    for (const profile of dueProfiles ?? []) {
      const userId = profile.id as string
      const attempts = Number(profile.deletion_finalization_attempts ?? 0) + 1

      try {
        await serviceClient
          .from('profiles')
          .update({
            deletion_finalization_started_at: new Date().toISOString(),
            deletion_finalization_attempts: attempts,
            deletion_finalization_error: null,
          })
          .eq('id', userId)

        await removeFeedbackAttachments(serviceClient, userId)

        const { error: deleteUserError } = await serviceClient.auth.admin.deleteUser(userId, false)
        if (deleteUserError) {
          throw deleteUserError
        }

        finalized.push(userId)
      } catch (deleteError) {
        console.error(deleteError)
        failed.push(userId)
        await serviceClient
          .from('profiles')
          .update({
            deletion_finalization_started_at: null,
            deletion_finalization_error: 'finalization_failed',
          })
          .eq('id', userId)
      }
    }

    return jsonResponse({ finalizedCount: finalized.length, failedCount: failed.length })
  } catch (error) {
    console.error(error)
    return jsonResponse({ error: 'Final deletion could not be processed.' }, 500)
  }
})
