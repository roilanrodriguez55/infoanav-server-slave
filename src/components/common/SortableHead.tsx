import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TableHead } from '@/components/ui/table'
import type { SortOrder } from '@/lib/postgrest'
import { cn } from '@/lib/utils'

interface SortableHeadProps {
  column: string
  label: string
  order?: SortOrder
  onSort: (column: string) => void
  className?: string
}

export function SortableHead({ column, label, order, onSort, className }: SortableHeadProps) {
  const isActive = order?.column === column
  const ariaSort = isActive ? (order.dir === 'asc' ? 'ascending' : 'descending') : 'none'
  const Icon = !isActive ? ArrowUpDown : order.dir === 'asc' ? ArrowUp : ArrowDown

  return (
    <TableHead aria-sort={ariaSort} className={cn(className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onSort(column)}
        className="-ml-2 h-8 px-2 font-medium text-foreground dark:text-gray-300"
      >
        {label}
        <Icon className={cn('h-3.5 w-3.5', isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400')} />
      </Button>
    </TableHead>
  )
}
