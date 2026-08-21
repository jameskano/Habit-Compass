const displayedMetadataLabels = ['Effective date', 'Fecha de entrada en vigor']

const isDisplayedMetadataLine = (line: string) =>
  displayedMetadataLabels.some((label) => line.startsWith(`${label}:`))

export const getLegalDocumentDisplayBody = (body: string) => {
  const lines = body.replace(/\r\n/g, '\n').split('\n')
  const firstSectionIndex = lines.findIndex((line) => line.trim().startsWith('## 1'))

  if (firstSectionIndex === -1) {
    return body
  }

  const displayedPreamble = lines
    .slice(0, firstSectionIndex)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('# ') || isDisplayedMetadataLine(line))

  return [...displayedPreamble, '', ...lines.slice(firstSectionIndex)].join('\n').trim()
}
