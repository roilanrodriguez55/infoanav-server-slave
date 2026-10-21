import { useCallback, useEffect, useState } from 'react'
import api from '@/services/config/axiosConfig'
import { buildQuery, parseContentRange, totalPages, type Filter, type SortOrder } from '@/lib/postgrest'

export interface ServerListOptions<F> {
  path: string
  select?: string
  pageSize?: number
  defaultOrder?: SortOrder
  initialFilters: F
  toFilters: (filters: F) => Filter[]
  searchColumns?: string[]
  searchKey?: keyof F
  debounceMs?: number
}

interface ListResult<T> {
  requestKey: string
  rows: T[]
  total: number
  error: string | null
}

export function useServerList<T, F extends object>(options: ServerListOptions<F>) {
  const {
    path,
    select,
    pageSize = 20,
    defaultOrder,
    initialFilters,
    toFilters,
    searchColumns,
    searchKey,
    debounceMs = 300,
  } = options

  const [filters, setFilters] = useState<F>(initialFilters)
  const [appliedSearch, setAppliedSearch] = useState<F[keyof F] | undefined>(
    searchKey ? initialFilters[searchKey] : undefined
  )
  const [page, setPage] = useState(1)
  const [order, setOrder] = useState<SortOrder | undefined>(defaultOrder)
  const [reloadCount, setReloadCount] = useState(0)
  const [result, setResult] = useState<ListResult<T> | null>(null)

  const searchValue = searchKey ? filters[searchKey] : undefined

  // El texto se aplica tras una pausa; los demas filtros aplican de inmediato.
  useEffect(() => {
    if (!searchKey) return
    const timer = setTimeout(() => {
      setAppliedSearch(searchValue)
      setPage(1)
    }, debounceMs)
    return () => clearTimeout(timer)
  }, [searchKey, searchValue, debounceMs])

  const appliedFilters = searchKey ? { ...filters, [searchKey]: appliedSearch } as F : filters
  const query = buildQuery({
    select,
    page,
    pageSize,
    order,
    filters: toFilters(appliedFilters),
    search: searchColumns?.length && typeof appliedSearch === 'string'
      ? { columns: searchColumns, text: appliedSearch }
      : undefined,
  })
  const requestKey = `${path}?${query}#${reloadCount}`

  useEffect(() => {
    let ignore = false
    const controller = new AbortController()

    api
      .get<T[]>(`${path}?${query}`, { headers: { Prefer: 'count=exact' }, signal: controller.signal })
      .then((response) => {
        if (ignore) return
        const rangoHeader: unknown = response.headers['content-range']
        const total = parseContentRange(typeof rangoHeader === 'string' ? rangoHeader : undefined).total ?? response.data.length
        setResult({ requestKey, rows: response.data, total, error: null })
        setPage((current) => Math.min(current, totalPages(total, pageSize)))
      })
      .catch(() => {
        if (ignore) return
        setResult({ requestKey, rows: [], total: 0, error: 'No se pudieron cargar los datos' })
      })

    return () => {
      ignore = true
      controller.abort()
    }
  }, [path, query, requestKey, pageSize])

  const setFilter = useCallback(<K extends keyof F>(key: K, value: F[K]) => {
    setFilters((current) => ({ ...current, [key]: value }))
    if (key !== searchKey) setPage(1)
  }, [searchKey])

  const resetFilters = useCallback(() => {
    setFilters(initialFilters)
    setAppliedSearch(searchKey ? initialFilters[searchKey] : undefined)
    setPage(1)
  }, [initialFilters, searchKey])

  const toggleOrder = useCallback((column: string) => {
    setOrder((current) => {
      if (current?.column !== column) return { column, dir: 'asc' }
      return { column, dir: current.dir === 'asc' ? 'desc' : 'asc' }
    })
    setPage(1)
  }, [])

  const reload = useCallback(() => setReloadCount((count) => count + 1), [])

  const currentResult = result
  const loading = currentResult?.requestKey !== requestKey

  return {
    rows: currentResult?.rows ?? [],
    total: currentResult?.total ?? 0,
    page,
    pageSize,
    totalPages: totalPages(currentResult?.total ?? 0, pageSize),
    setPage,
    order,
    toggleOrder,
    filters,
    setFilter,
    resetFilters,
    loading,
    error: currentResult?.error ?? null,
    reload,
  }
}
