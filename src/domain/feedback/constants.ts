export const FEEDBACK_TYPES = ['suggestion', 'problem', 'other'] as const

export const FEEDBACK_STATUSES = ['new', 'triaged', 'closed'] as const

export const FEEDBACK_MESSAGE_MAX_LENGTH = 4000

export const FEEDBACK_ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024

export const FEEDBACK_ATTACHMENT_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const

export const FEEDBACK_RATE_LIMIT_MAX_SUBMISSIONS = 5

export const FEEDBACK_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000

export const FEEDBACK_ATTACHMENTS_BUCKET = 'feedback-attachments'
