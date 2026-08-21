import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'

export type FeedbackNotificationCall = {
  authorization: string | null
  body: Record<string, unknown>
  method: string
  path: string
}

export type FakeFeedbackNotificationServer = {
  close: () => Promise<void>
  edgeRuntimeUrl: string
  getCalls: () => FeedbackNotificationCall[]
  resetCalls: () => void
  setStatus: (status: number) => void
  url: string
}

const readBody = async (request: IncomingMessage) =>
  new Promise<string>((resolve, reject) => {
    let body = ''

    request.on('data', (chunk: Buffer) => {
      body += chunk.toString('utf8')
    })
    request.on('end', () => resolve(body))
    request.on('error', reject)
  })

const writeJson = (response: ServerResponse, status: number, body: unknown) => {
  response.writeHead(status, { 'Content-Type': 'application/json' })
  response.end(JSON.stringify(body))
}

export const startFakeFeedbackNotificationServer =
  async (): Promise<FakeFeedbackNotificationServer> => {
    const calls: FeedbackNotificationCall[] = []
    let responseStatus = 200

    const server = createServer(async (request: IncomingMessage, response: ServerResponse) => {
      const path = new URL(request.url ?? '/', 'http://127.0.0.1').pathname
      const rawBody = await readBody(request)
      const parsedBody = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : {}

      calls.push({
        authorization: request.headers.authorization ?? null,
        body: parsedBody,
        method: request.method ?? 'GET',
        path,
      })

      writeJson(response, responseStatus, {
        delivered: responseStatus >= 200 && responseStatus < 300,
      })
    })

    await new Promise<void>((resolve) => {
      server.listen(0, '0.0.0.0', resolve)
    })

    const address = server.address()
    if (!address || typeof address === 'string') {
      throw new Error('Fake feedback notification server did not bind to a TCP port.')
    }

    return {
      close: () => closeServer(server),
      edgeRuntimeUrl: `http://host.docker.internal:${address.port}`,
      getCalls: () => [...calls],
      resetCalls: () => {
        calls.splice(0)
      },
      setStatus: (status) => {
        responseStatus = status
      },
      url: `http://127.0.0.1:${address.port}`,
    }
  }

const closeServer = (server: Server) =>
  new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error)
        return
      }

      resolve()
    })
  })
