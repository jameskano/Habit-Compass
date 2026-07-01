import { Trash2, Upload } from 'lucide-react'
import { FormattedMessage, useIntl } from 'react-intl'

import { FEEDBACK_ATTACHMENT_MIME_TYPES } from '@/domain/feedback'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'

type ScreenshotFieldProps = {
  id: string
  fileErrorId: string | null
  selectedFile: File | null
  onFileChange: (fileList: FileList | null) => void
  onRemoveFile: () => void
}

export const ScreenshotField = ({
  fileErrorId,
  id,
  onFileChange,
  onRemoveFile,
  selectedFile,
}: ScreenshotFieldProps) => {
  const intl = useIntl()

  return (
    <div className="space-y-2 rounded-xl border border-border/70 p-3">
      <label className="flex items-center gap-2 text-sm font-medium" htmlFor={id}>
        <Upload aria-hidden size={16} />
        <FormattedMessage id="settings.support.feedback.screenshot.label" />
      </label>
      <Input
        id={id}
        type="file"
        accept={FEEDBACK_ATTACHMENT_MIME_TYPES.join(',')}
        onChange={(event) => onFileChange(event.currentTarget.files)}
      />
      {fileErrorId ? (
        <p className="text-xs text-destructive">
          <FormattedMessage id={fileErrorId} />
        </p>
      ) : null}
      {selectedFile ? (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-muted px-3 py-2 text-sm">
          <span className="min-w-0 truncate">{selectedFile.name}</span>
          <Button
            type="button"
            variant="ghost"
            className="size-9 shrink-0 rounded-full p-0"
            aria-label={intl.formatMessage({
              id: 'settings.support.feedback.screenshot.remove',
            })}
            onClick={onRemoveFile}
          >
            <Trash2 aria-hidden size={16} />
          </Button>
        </div>
      ) : null}
    </div>
  )
}
