import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { totalPages } from '@/lib/postgrest'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  loading?: boolean
}

const WINDOW_SIZE = 5

export function Pagination({ page, pageSize, total, onPageChange, loading = false }: PaginationProps) {
  const pages = totalPages(total, pageSize)
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  const start = Math.max(1, Math.min(page - Math.floor(WINDOW_SIZE / 2), pages - WINDOW_SIZE + 1))
  const end = Math.min(pages, start + WINDOW_SIZE - 1)
  const windowPages = Array.from({ length: end - start + 1 }, (_, index) => start + index)

  return (
    <nav
      aria-label="Paginación"
      className="flex flex-col sm:flex-row items-center justify-between gap-3 py-3 text-sm text-muted-foreground"
    >
      <span>{total === 0 ? 'Sin resultados' : `Mostrando ${from}-${to} de ${total}`}</span>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={loading || page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="dark:border-gray-600 dark:text-gray-300"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>

        {windowPages.map((pageNumber) => (
          <Button
            key={pageNumber}
            variant={pageNumber === page ? 'default' : 'outline'}
            size="sm"
            disabled={loading}
            aria-current={pageNumber === page ? 'page' : undefined}
            onClick={() => onPageChange(pageNumber)}
            className={pageNumber === page
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'dark:border-gray-600 dark:text-gray-300'}
          >
            {pageNumber}
          </Button>
        ))}

        <Button
          variant="outline"
          size="sm"
          disabled={loading || page >= pages}
          onClick={() => onPageChange(page + 1)}
          className="dark:border-gray-600 dark:text-gray-300"
        >
          Siguiente
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  )
}
