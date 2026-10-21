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
  withTime?: boolean
  placeholder?: string
  disabled?: boolean
  className?: string
  inputClassName?: string
  'aria-label'?: string
  id?: string
}

const HORAS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTOS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

// Convierte 'aaaa-mm-dd' o 'aaaa-mm-ddTHH:mm' en fecha local (sin pasar por UTC)
function isoToDate(iso: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T\d{2}:\d{2})?$/.exec(iso)
  if (!match) return undefined
  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  const date = new Date(year, month, day)
  const same = date.getFullYear() === year && date.getMonth() === month && date.getDate() === day
  return same ? date : undefined
}

// Devuelve 'HH:mm' si el valor 'aaaa-mm-ddTHH:mm' lo trae
function isoToHora(iso: string): string | undefined {
  return /T(\d{2}:\d{2})$/.exec(iso)?.[1]
}

function fechaAIso(fecha: Date, hora: string | undefined): string {
  const dia = format(fecha, 'yyyy-MM-dd')
  return hora ? `${dia}T${hora}` : dia
}

function fechaATexto(fecha: Date, hora: string | undefined): string {
  const dia = format(fecha, 'dd/MM/yyyy')
  return hora ? `${dia} ${hora}` : dia
}

function isoToTexto(iso: string, conHora: boolean): string {
  const date = isoToDate(iso)
  if (!date) return ''
  return fechaATexto(date, conHora ? isoToHora(iso) : undefined)
}

// Solo digitos, con '/' al entrar el tercer digito y ' HH:mm' si hay hora
function aplicarMascara(raw: string, conHora: boolean): string {
  const digitos = raw.replace(/\D/g, '').slice(0, conHora ? 12 : 8)
  const fecha = digitos.slice(0, 8)
  let texto = fecha
  if (fecha.length > 2) texto = `${fecha.slice(0, 2)}/${fecha.slice(2, 4)}`
  if (fecha.length > 4) texto += `/${fecha.slice(4)}`
  if (!conHora || digitos.length <= 8) return texto
  const hora = digitos.slice(8)
  if (hora.length <= 2) return `${texto} ${hora}`
  return `${texto} ${hora.slice(0, 2)}:${hora.slice(2)}`
}

// Devuelve la fecha si el texto es real y el año es >= 1900
function textoAFecha(texto: string, conHora: boolean): Date | undefined {
  const formato = conHora ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy'
  const fecha = parse(texto, formato, new Date())
  if (!isValid(fecha)) return undefined
  if (format(fecha, formato) !== texto) return undefined
  if (fecha.getFullYear() < 1900) return undefined
  return fecha
}

const selectClass =
  'h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30'

export function DatePickerField({
  value,
  onChange,
  withTime = false,
  placeholder = withTime ? 'dd/mm/aaaa HH:mm' : 'dd/mm/aaaa',
  disabled,
  className,
  inputClassName,
  'aria-label': ariaLabel,
  id,
}: DatePickerFieldProps) {
  const [texto, setTexto] = useState(() => isoToTexto(value, withTime))
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
    setTexto(isoToTexto(value, withTime))
    setInvalida(false)
  }

  const seleccionada = isoToDate(value)
  // Hora aplicada al elegir un dia; 00:00 si el valor aun no trae hora
  const horaValor = withTime ? (isoToHora(value) ?? '00:00') : undefined
  const [horaSel, minutoSel] = horaValor ? horaValor.split(':') : ['', '']

  function handleTextoChange(e: ChangeEvent<HTMLInputElement>) {
    const masked = aplicarMascara(e.target.value, withTime)
    setTexto(masked)

    if (masked === '') {
      setInvalida(false)
      onChange('')
      return
    }
    if (masked.length < (withTime ? 16 : 10)) {
      setInvalida(false)
      return
    }

    const fecha = textoAFecha(masked, withTime)
    if (fecha) {
      setInvalida(false)
      onChange(fechaAIso(fecha, withTime ? format(fecha, 'HH:mm') : undefined))
    } else {
      setInvalida(true)
    }
  }

  function aplicarFecha(fecha: Date | undefined, hora: string | undefined = horaValor) {
    if (fecha) {
      setTexto(fechaATexto(fecha, hora))
      setInvalida(false)
      onChange(fechaAIso(fecha, hora))
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

  function cambiarHora(parte: 'hora' | 'minuto', nuevo: string) {
    const fecha = isoToDate(value)
    if (!fecha) return
    const hora = parte === 'hora' ? `${nuevo}:${minutoSel}` : `${horaSel}:${nuevo}`
    setTexto(fechaATexto(fecha, hora))
    setInvalida(false)
    onChange(fechaAIso(fecha, hora))
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
    if (texto !== '' && !textoAFecha(texto, withTime)) {
      setTexto(isoToTexto(value, withTime))
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
            className={cn('pr-9', inputClassName)}
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
          <Button
            variant="neutral"
            size="sm"
            onClick={() => {
              const ahora = new Date()
              aplicarFecha(ahora, withTime ? format(ahora, 'HH:mm') : undefined)
            }}
          >
            Hoy
          </Button>
          {withTime && (
            <div className="flex items-center gap-1">
              <select
                aria-label="Hora"
                className={selectClass}
                value={horaSel}
                disabled={disabled === true || !seleccionada}
                onChange={(e) => cambiarHora('hora', e.target.value)}
              >
                {HORAS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
              <span className="text-sm text-muted-foreground">:</span>
              <select
                aria-label="Minuto"
                className={selectClass}
                value={minutoSel}
                disabled={disabled === true || !seleccionada}
                onChange={(e) => cambiarHora('minuto', e.target.value)}
              >
                {MINUTOS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}
          <Button variant="neutral" size="sm" onClick={() => aplicarFecha(undefined)}>
            Limpiar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
