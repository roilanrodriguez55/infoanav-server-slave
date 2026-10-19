import { useState } from 'react'
import { totalPages } from '@/lib/postgrest'

// Paginacion en cliente para listados pequenos que ya vienen completos (usuarios, catalogos)
export function usePagedItems<T>(items: T[], pageSize = 20) {
  const [requested, setPage] = useState(1)
  const page = Math.min(requested, totalPages(items.length, pageSize))
  const pageItems = items.slice((page - 1) * pageSize, page * pageSize)

  return { page, setPage, pageItems, pageSize, total: items.length }
}
