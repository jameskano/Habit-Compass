type QueryWithMeta = {
  meta?: Record<string, unknown>
}

export const pageBlockingQueryMeta = {
  pageBlocking: true,
} as const

export type PageBlockingQueryOptions = {
  pageBlocking?: boolean
}

export const getPageBlockingQueryMeta = (options: PageBlockingQueryOptions = {}) => {
  return options.pageBlocking ? pageBlockingQueryMeta : undefined
}

export const isPageBlockingQuery = (query: QueryWithMeta) => {
  return query.meta?.pageBlocking === true
}

export const shouldThrowPageBlockingQueryError = (_error: unknown, query: QueryWithMeta) => {
  return isPageBlockingQuery(query)
}
