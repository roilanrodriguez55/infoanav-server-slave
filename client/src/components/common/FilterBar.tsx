import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface FilterBarProps {
  children: ReactNode
  onReset: () => void
  activeCount?: number
}

interface FilterFieldProps {
  label: string
  children: ReactNode
  className?: string
}

export function FilterBar({ children, onReset, activeCount = 0 }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      {children}
      <Button
        variant="outline"
        disabled={activeCount === 0}
        onClick={onReset}
        className="dark:border-gray-600 dark:text-gray-300"
      >
        Limpiar filtros
      </Button>
    </div>
  )
}

export function FilterField({ label, children, className }: FilterFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}
