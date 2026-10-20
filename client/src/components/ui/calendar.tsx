import { DayPicker, type ChevronProps, type DayPickerProps } from 'react-day-picker'
import { es } from 'date-fns/locale'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'

// Icono de navegacion y de los desplegables de mes/año
function CalendarChevron({ orientation, className }: ChevronProps) {
  const Icon = orientation === 'left' ? ChevronLeft : orientation === 'right' ? ChevronRight : ChevronDown
  return <Icon className={cn('size-4 text-icon', className)} aria-hidden />
}

function Calendar({
  className,
  classNames,
  components,
  showOutsideDays = true,
  captionLayout = 'dropdown',
  startMonth = new Date(1990, 0),
  endMonth = new Date(new Date().getFullYear() + 5, 11),
  weekStartsOn = 1,
  locale = es,
  ...props
}: DayPickerProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      startMonth={startMonth}
      endMonth={endMonth}
      weekStartsOn={weekStartsOn}
      locale={locale}
      className={cn('w-fit p-3', className)}
      classNames={{
        months: 'flex flex-col gap-4',
        month: 'flex flex-col gap-4',
        month_caption: 'flex h-8 items-center justify-center',
        caption_label: 'text-sm font-medium text-foreground',
        dropdowns: 'flex items-center gap-1.5',
        dropdown_root:
          'relative inline-flex h-8 items-center rounded-md border border-border bg-background focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
        dropdown: 'absolute inset-0 w-full cursor-pointer opacity-0',
        nav: 'absolute inset-x-3 top-3 flex items-center justify-between',
        button_previous:
          'inline-flex size-8 items-center justify-center rounded-md text-icon transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50',
        button_next:
          'inline-flex size-8 items-center justify-center rounded-md text-icon transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50',
        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday: 'w-8 text-[0.8rem] font-normal text-muted-foreground',
        week: 'mt-1 flex w-full',
        day: 'relative size-8 p-0 text-center text-sm',
        day_button:
          'inline-flex size-8 items-center justify-center rounded-md text-sm font-normal text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50',
        selected:
          '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary/90',
        today: '[&>button]:font-semibold [&>button]:text-primary',
        outside: 'opacity-50',
        disabled: 'opacity-50',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: CalendarChevron,
        ...components,
      }}
      {...props}
    />
  )
}

export { Calendar }
