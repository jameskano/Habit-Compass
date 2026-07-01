const textEncoder = new TextEncoder()

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

export type ZipEntryInput = {
  path: string
  content: string | Uint8Array
}

export const createStoredZip = (entries: ZipEntryInput[]) => {
  const localFileChunks: Uint8Array[] = []
  const centralDirectoryChunks: Uint8Array[] = []
  let localOffset = 0

  for (const entry of entries) {
    const nameBytes = textEncoder.encode(entry.path)
    const contentBytes =
      typeof entry.content === 'string' ? textEncoder.encode(entry.content) : entry.content
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
