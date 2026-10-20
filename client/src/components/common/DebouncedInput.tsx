import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type FocusEvent,
  type KeyboardEvent,
} from 'react'
import { Input } from '@/components/ui/input'

type DebouncedInputProps = Omit<ComponentProps<'input'>, 'value' | 'onChange'> & {
  value: string
  onValueChange: (value: string) => void
  debounceMs?: number
}

// Input que notifica el valor tras una pausa al teclear; Enter y blur aplican de inmediato
export function DebouncedInput({
  value,
  onValueChange,
  debounceMs = 300,
  onBlur,
  onKeyDown,
  ...props
}: DebouncedInputProps) {
  const [draft, setDraft] = useState(value)
  const draftRef = useRef(value)
  // Ultimo valor enviado, para ignorar el eco que llega desde el padre
  const enviadoRef = useRef<string | undefined>(undefined)
  const timerRef = useRef<number | undefined>(undefined)

  const cancelarPendiente = useCallback(() => {
    if (timerRef.current !== undefined) {
      window.clearTimeout(timerRef.current)
      timerRef.current = undefined
    }
  }, [])

  // Sincroniza desde fuera (p. ej. Limpiar filtros) y cancela el envio pendiente
  useEffect(() => {
    const eco = value === enviadoRef.current
    enviadoRef.current = undefined
    if (eco || value === draftRef.current) return
    cancelarPendiente()
    draftRef.current = value
    setDraft(value)
  }, [value, cancelarPendiente])

  useEffect(() => cancelarPendiente, [cancelarPendiente])

  function enviar(next: string) {
    enviadoRef.current = next
    onValueChange(next)
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const next = e.target.value
    draftRef.current = next
    setDraft(next)
    cancelarPendiente()
    timerRef.current = window.setTimeout(() => {
      timerRef.current = undefined
      enviar(next)
    }, debounceMs)
  }

  // Aplica el valor pendiente sin esperar al timer
  function flush() {
    if (timerRef.current === undefined) return
    cancelarPendiente()
    enviar(draftRef.current)
  }

  function handleBlur(e: FocusEvent<HTMLInputElement>) {
    flush()
    onBlur?.(e)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') flush()
    onKeyDown?.(e)
  }

  return (
    <Input
      {...props}
      value={draft}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  )
}
