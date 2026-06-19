import type { ReactNode } from 'react'

const inlineCodePattern = /(`[^`]+`)/g

const renderInlineText = (text: string) =>
  text.split(inlineCodePattern).map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={`${part}:${index}`} className="rounded bg-muted px-1 py-0.5 text-[0.9em]">
          {part.slice(1, -1)}
        </code>
      )
    }

    return part
  })

const paragraphText = (lines: string[]) => lines.join(' ').trim()

const isBulletLine = (line: string) => line.startsWith('- ')
const isNumberedLine = (line: string) => /^\d+\.\s/.test(line)

export const MarkdownDocument = ({ body }: { body: string }) => {
  const lines = body.replace(/\r\n/g, '\n').split('\n')
  const blocks: ReactNode[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index].trim()

    if (!line) {
      index += 1
      continue
    }

    if (line.startsWith('# ')) {
      blocks.push(
        <h2 key={index} className="text-2xl font-semibold tracking-tight">
          {renderInlineText(line.slice(2))}
        </h2>,
      )
      index += 1
      continue
    }

    if (line.startsWith('## ')) {
      blocks.push(
        <h3 key={index} className="pt-4 text-lg font-semibold">
          {renderInlineText(line.slice(3))}
        </h3>,
      )
      index += 1
      continue
    }

    if (line.startsWith('### ')) {
      blocks.push(
        <h4 key={index} className="pt-2 text-base font-semibold">
          {renderInlineText(line.slice(4))}
        </h4>,
      )
      index += 1
      continue
    }

    if (isBulletLine(line)) {
      const items: string[] = []
      while (index < lines.length && isBulletLine(lines[index].trim())) {
        items.push(lines[index].trim().slice(2))
        index += 1
      }
      blocks.push(
        <ul
          key={index}
          className="list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground"
        >
          {items.map((item, itemIndex) => (
            <li key={`${item}:${itemIndex}`}>{renderInlineText(item)}</li>
          ))}
        </ul>,
      )
      continue
    }

    if (isNumberedLine(line)) {
      const items: string[] = []
      while (index < lines.length && isNumberedLine(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s/, ''))
        index += 1
      }
      blocks.push(
        <ol
          key={index}
          className="list-decimal space-y-1 pl-5 text-sm leading-6 text-muted-foreground"
        >
          {items.map((item, itemIndex) => (
            <li key={`${item}:${itemIndex}`}>{renderInlineText(item)}</li>
          ))}
        </ol>,
      )
      continue
    }

    const paragraphLines = [line]
    index += 1
    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].trim().startsWith('#') &&
      !isBulletLine(lines[index].trim()) &&
      !isNumberedLine(lines[index].trim())
    ) {
      paragraphLines.push(lines[index].trim())
      index += 1
    }

    blocks.push(
      <p key={index} className="text-sm leading-6 text-muted-foreground">
        {renderInlineText(paragraphText(paragraphLines))}
      </p>,
    )
  }

  return <article className="space-y-4">{blocks}</article>
}
