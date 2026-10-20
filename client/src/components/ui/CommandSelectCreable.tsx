import { useState } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { CAMPO_PENDIENTE, cn } from '@/lib/utils';

// Componentes shadcn
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';

interface Item {
  id: string;
  nombre: string;
}

interface CommandSelectCreableProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  items: Item[];
  label: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  pendiente?: boolean;
  // Si se pasa, el texto buscado sin coincidencia exacta ofrece «Crear». Debe devolver el item creado.
  onCrear?: (nombre: string) => Promise<Item>;
}

export function CommandSelectCreable({
  value,
  onValueChange,
  placeholder,
  searchPlaceholder = "Buscar...",
  emptyMessage = "No se encontraron resultados.",
  items,
  label,
  required = false,
  disabled = false,
  className = "",
  pendiente = false,
  onCrear,
}: CommandSelectCreableProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [creando, setCreando] = useState(false);
  const [errorCrear, setErrorCrear] = useState<string | null>(null);

  const selectedItem = items.find(item => item.id === value);
  const textoBuscado = searchQuery.trim();
  const existeExacto = items.some(item => item.nombre.trim().toLowerCase() === textoBuscado.toLowerCase());
  const mostrarCrear = Boolean(onCrear) && textoBuscado !== '' && !existeExacto;

  const cambiarAbierto = (abierto: boolean) => {
    setOpen(abierto);
    if (!abierto) {
      setSearchQuery('');
      setErrorCrear(null);
    }
  };

  const crear = async () => {
    if (!onCrear) return;
    setCreando(true);
    setErrorCrear(null);
    try {
      const creado = await onCrear(textoBuscado);
      onValueChange(creado.id);
      cambiarAbierto(false);
    } catch (error: unknown) {
      setErrorCrear(error instanceof Error ? error.message : 'No se pudo crear');
    } finally {
      setCreando(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>

      <Popover open={open} onOpenChange={cambiarAbierto}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between h-10 font-normal",
              !value && "text-muted-foreground",
              pendiente && CAMPO_PENDIENTE,
              className
            )}
            disabled={disabled}
          >
            {value ? selectedItem?.nombre : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-icon" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder={searchPlaceholder}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.nombre}
                    onSelect={() => {
                      onValueChange(item.id);
                      cambiarAbierto(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === item.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {item.nombre}
                  </CommandItem>
                ))}
              </CommandGroup>
              {mostrarCrear && (
                <CommandGroup forceMount>
                  <CommandItem
                    forceMount
                    value={`crear ${textoBuscado}`}
                    disabled={creando}
                    onSelect={() => void crear()}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {creando ? 'Creando...' : `Crear «${textoBuscado}»`}
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {errorCrear && <p className="text-xs text-red-600 dark:text-red-400">{errorCrear}</p>}
    </div>
  );
}
