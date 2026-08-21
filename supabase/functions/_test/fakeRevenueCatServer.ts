import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'

import type { RevenueCatSubscriberResponse } from '../_shared/revenuecat'

export type RevenueCatCall = {
  method: string
  path: string
  storeTransactionId: string | null
  userId: string | null
}

type RevenueCatScenario = {
  cancellationStatus?: number
  customerResponses: RevenueCatSubscriberResponse[]
  deletionStatus?: number
}

export type FakeRevenueCatServer = {
  close: () => Promise<void>
  edgeRuntimeUrl: string
  getCalls: () => RevenueCatCall[]
  setScenario: (scenario: RevenueCatScenario) => void
  url: string
}

const writeJson = (response: ServerResponse, status: number, body: unknown) => {
  response.writeHead(status, { 'Content-Type': 'application/json' })
  response.end(JSON.stringify(body))
}

const parseSubscriberPath = (path: string) => {
  const subscriberMatch = path.match(/^\/v1\/subscribers\/([^/]+)$/)
  if (subscriberMatch) {
    return {
      storeTransactionId: null,
      userId: decodeURIComponent(subscriberMatch[1] ?? ''),
    }
  }

  const cancellationMatch = path.match(
    /^\/v1\/subscribers\/([^/]+)\/subscriptions\/([^/]+)\/cancel$/,
  )
  if (cancellationMatch) {
    return {
      storeTransactionId: decodeURIComponent(cancellationMatch[2] ?? ''),
      userId: decodeURIComponent(cancellationMatch[1] ?? ''),
    }
  }

  return {
    storeTransactionId: null,
    userId: null,
  }
}

export const startFakeRevenueCatServer = async (): Promise<FakeRevenueCatServer> => {
  const calls: RevenueCatCall[] = []
  let scenario: RevenueCatScenario = { customerResponses: [] }
  let customerReadIndex = 0

  const server = createServer((request: IncomingMessage, response: ServerResponse) => {
    const path = new URL(request.url ?? '/', 'http://127.0.0.1').pathname
    const { storeTransactionId, userId } = parseSubscriberPath(path)

    calls.push({
      method: request.method ?? 'GET',
      path,
      storeTransactionId,
      userId,
    })

    if (request.method === 'GET' && userId && !storeTransactionId) {
      const customer =
        scenario.customerResponses[
          Math.min(customerReadIndex, scenario.customerResponses.length - 1)
        ] ?? ({ subscriber: { subscriptions: {} } } satisfies RevenueCatSubscriberResponse)
      customerReadIndex += 1
      writeJson(response, 200, customer)
      return
    }

    if (request.method === 'POST' && userId && storeTransactionId) {
      writeJson(response, scenario.cancellationStatus ?? 200, { cancelled: true })
      return
    }

    if (request.method === 'DELETE' && userId && !storeTransactionId) {
      writeJson(response, scenario.deletionStatus ?? 200, { deleted: true })
      return
    }

    writeJson(response, 404, { error: 'not_found' })
  })

  await new Promise<void>((resolve) => {
    server.listen(0, '0.0.0.0', resolve)
  })

  const address = server.address()
  if (!address || typeof address === 'string') {
    throw new Error('Fake RevenueCat server did not bind to a TCP port.')
  }

  return {
    close: () => closeServer(server),
    edgeRuntimeUrl: `http://host.docker.internal:${address.port}`,
    getCalls: () => [...calls],
    setScenario: (nextScenario) => {
      calls.splice(0)
      customerReadIndex = 0
      scenario = nextScenario
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
