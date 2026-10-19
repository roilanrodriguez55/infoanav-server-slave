export type FilterOp = 'eq' | 'neq' | 'gte' | 'lte' | 'gt' | 'lt' | 'ilike' | 'is' | 'not_is' | 'in'

export interface Filter {
  column: string
  op: FilterOp
  value: string | number | boolean | null | (string | number)[]
}

export interface SortOrder {
  column: string
  dir: 'asc' | 'desc'
}

export interface ListParams {
  select?: string
  page: number
  pageSize: number
  order?: SortOrder
  filters?: Filter[]
  search?: { columns: string[]; text: string }
}

export interface ContentRange {
  from: number
  to: number
  total: number | null
}

// PostgREST interpreta (), * y , como sintaxis; se codifican dentro de los valores.
function encodeValue(value: string): string {
  return encodeURIComponent(value).replace(/[()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
}

// Quita los caracteres que rompen la sintaxis de or=(...) y de ilike.
function sanitizeSearchText(text: string): string {
  return text.replace(/[,()*"\\]/g, '').trim()
}

function filterToParam(filter: Filter): string | null {
  const { column, op, value } = filter

  if (value === undefined || value === '') return null
  if (value === null && op !== 'is' && op !== 'not_is') return null

  if (op === 'in') {
    const items = Array.isArray(value) ? value : [value]
    if (items.length === 0) return null
    return `${column}=in.(${items.map((item) => encodeValue(String(item))).join(',')})`
  }

  if (op === 'is') {
    return `${column}=is.${value === null ? 'null' : String(value)}`
  }

  if (op === 'not_is') {
    return `${column}=not.is.${value === null ? 'null' : String(value)}`
  }

  if (op === 'ilike') {
    return `${column}=ilike.*${encodeValue(String(value))}*`
  }

  return `${column}=${op}.${encodeValue(String(value))}`
}

export function buildQuery(params: ListParams): string {
  const { select = '*', page, pageSize, order, filters = [], search } = params
  const parts = [`select=${select}`, 'deleted_at=is.null']

  for (const filter of filters) {
    const param = filterToParam(filter)
    if (param) parts.push(param)
  }

  const searchText = search ? sanitizeSearchText(search.text) : ''
  if (search && searchText && search.columns.length > 0) {
    const conditions = search.columns.map((column) => `${column}.ilike.*${encodeValue(searchText)}*`)
    parts.push(`or=(${conditions.join(',')})`)
  }

  if (order) parts.push(`order=${order.column}.${order.dir}`)

  parts.push(`limit=${pageSize}`, `offset=${Math.max(0, (page - 1) * pageSize)}`)

  return parts.join('&')
}

export function parseContentRange(header: string | undefined | null): ContentRange {
  const invalid: ContentRange = { from: 0, to: 0, total: null }
  if (!header) return invalid

  const match = /^(?:(\d+)-(\d+)|\*)\/(\d+|\*)$/.exec(header.trim())
  if (!match) return invalid

  const [, from, to, total] = match
  return {
    from: from === undefined ? 0 : Number(from),
    to: to === undefined ? 0 : Number(to),
    total: total === '*' ? null : Number(total),
  }
}

export function dateRangeFilters(column: string, from?: string, to?: string): Filter[] {
  const filters: Filter[] = []
  if (from) filters.push({ column, op: 'gte', value: `${from}T00:00:00` })
  if (to) filters.push({ column, op: 'lte', value: `${to}T23:59:59.999` })
  return filters
}

export function totalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize))
}
