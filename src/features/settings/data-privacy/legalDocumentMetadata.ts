export const getLegalDocumentMetadataValue = (body: string, labels: string[]) => {
  const lines = body.split(/\r?\n/)

  for (const label of labels) {
    const line = lines.find((entry) => entry.startsWith(`${label}:`))
    if (line) {
      return line.slice(label.length + 1).trim()
    }
  }

  return null
}
