import { useRef, useState, type ChangeEvent, type FocusEvent, type KeyboardEvent } from 'react'
import { format, isValid, parse } from 'date-fns'
import { CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface DatePickerFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  'aria-label'?: string
  id?: string
}

// Convierte 'aaaa-mm-dd' en fecha local (sin pasar por UTC)
function isoToDate(iso: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return undefined
  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  const date = new Date(year, month, day)
  const same = date.getFullYear() === year && date.getMonth() === month && date.getDate() === day
  return same ? date : undefined
}

function isoToTexto(iso: string): string {
  const date = isoToDate(iso)
  return date ? format(date, 'dd/MM/yyyy') : ''
}

// Solo digitos, con '/' al entrar el tercer digito
function aplicarMascara(raw: string): string {
  const digitos = raw.replace(/\D/g, '').slice(0, 8)
  if (digitos.length <= 2) return digitos
  if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`
}

// Devuelve la fecha si el texto dd/mm/aaaa es real y el año es >= 1900
function textoAFecha(texto: string): Date | undefined {
  const fecha = parse(texto, 'dd/MM/yyyy', new Date())
  if (!isValid(fecha)) return undefined
  if (format(fecha, 'dd/MM/yyyy') !== texto) return undefined
  if (fecha.getFullYear() < 1900) return undefined
  return fecha
}

export function DatePickerField({
  value,
  onChange,
  placeholder = 'dd/mm/aaaa',
  disabled,
  className,
  'aria-label': ariaLabel,
  id,
}: DatePickerFieldProps) {
  const [texto, setTexto] = useState(() => isoToTexto(value))
  const [invalida, setInvalida] = useState(false)
  const [abierto, setAbierto] = useState(false)
  const [valorPrevio, setValorPrevio] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  // Evita que el foco devuelto al input reabra el calendario
  const ignorarAperturaRef = useRef(false)
  // Evita que Radix devuelva el foco al boton al elegir un dia
  const seleccionRef = useRef(false)
  const escapeRef = useRef(false)

  // Sincroniza el texto cuando el valor cambia desde fuera (p. ej. Limpiar)
  if (value !== valorPrevio) {
    setValorPrevio(value)
    setTexto(isoToTexto(value))
    setInvalida(false)
  }

  const seleccionada = isoToDate(value)

  function handleTextoChange(e: ChangeEvent<HTMLInputElement>) {
    const masked = aplicarMascara(e.target.value)
    setTexto(masked)

    if (masked === '') {
      setInvalida(false)
      onChange('')
      return
    }
    if (masked.length < 10) {
      setInvalida(false)
      return
    }

    const fecha = textoAFecha(masked)
    if (fecha) {
      setInvalida(false)
      onChange(format(fecha, 'yyyy-MM-dd'))
    } else {
      setInvalida(true)
    }
  }

  function aplicarFecha(fecha: Date | undefined) {
    if (fecha) {
      setTexto(format(fecha, 'dd/MM/yyyy'))
      setInvalida(false)
      onChange(format(fecha, 'yyyy-MM-dd'))
    } else {
      setTexto('')
      setInvalida(false)
      onChange('')
    }
    setAbierto(false)
    seleccionRef.current = true
    ignorarAperturaRef.current = true
    inputRef.current?.focus()
    ignorarAperturaRef.current = false
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      setAbierto(false)
    }
    // Flecha abajo entra al calendario para elegir el dia con el teclado
    if (e.key === 'ArrowDown' && !disabled) {
      e.preventDefault()
      setAbierto(true)
      setTimeout(() => {
        contentRef.current?.querySelector<HTMLButtonElement>('[role=grid] button[tabindex="0"]')?.focus()
      }, 50)
    }
  }

  // Al salir del campo con un texto incompleto o invalido vuelve al valor aplicado
  function handleBlur(e: FocusEvent<HTMLInputElement>) {
    const destino = e.relatedTarget
    if (destino instanceof Node && (wrapperRef.current?.contains(destino) || contentRef.current?.contains(destino))) return
    if (texto !== '' && !textoAFecha(texto)) {
      setTexto(isoToTexto(value))
      setInvalida(false)
    }
  }

  function handleCloseAutoFocus(e: Event) {
    if (seleccionRef.current) {
      e.preventDefault()
      seleccionRef.current = false
    }
    // Con Escape el foco vuelve al campo para seguir escribiendo
    if (escapeRef.current) {
      e.preventDefault()
      escapeRef.current = false
      ignorarAperturaRef.current = true
      inputRef.current?.focus()
      ignorarAperturaRef.current = false
    }
  }

  // Clic dentro del campo o del boton no cierra el popover
  function handleInteractOutside(e: Event) {
    if (e.target instanceof Node && wrapperRef.current?.contains(e.target)) {
      e.preventDefault()
    }
  }

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverAnchor asChild>
        <div ref={wrapperRef} className={cn('relative', className)}>
          <Input
            ref={inputRef}
            id={id}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder={placeholder}
            value={texto}
            disabled={disabled}
            aria-label={ariaLabel}
            aria-invalid={invalida || undefined}
            className="pr-9"
            onChange={handleTextoChange}
            onFocus={() => {
              if (!ignorarAperturaRef.current && !disabled) setAbierto(true)
            }}
            onClick={() => {
              if (!disabled) setAbierto(true)
            }}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
          />
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              disabled={disabled}
              aria-label="Abrir calendario"
              className="absolute top-1/2 right-1 -translate-y-1/2"
            >
              <CalendarDays className="text-icon" />
            </Button>
          </PopoverTrigger>
        </div>
      </PopoverAnchor>
      <PopoverContent
        ref={contentRef}
        align="start"
        className="w-auto p-2.5"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onEscapeKeyDown={() => {
          escapeRef.current = true
        }}
        onCloseAutoFocus={handleCloseAutoFocus}
        onInteractOutside={handleInteractOutside}
      >
        <Calendar
          mode="single"
          selected={seleccionada}
          defaultMonth={seleccionada ?? new Date()}
          onSelect={(dia) => {
            if (dia) aplicarFecha(dia)
          }}
        />
        <div className="flex items-center justify-between gap-2 border-t border-border pt-2.5">
          <Button variant="neutral" size="sm" onClick={() => aplicarFecha(new Date())}>
            Hoy
          </Button>
          <Button variant="neutral" size="sm" onClick={() => aplicarFecha(undefined)}>
            Limpiar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
