import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
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

interface CommandSelectProps {
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
  // Oculta la etiqueta interna cuando el contenedor ya la pinta (p. ej. FilterField).
  hideLabel?: boolean;
}

export function CommandSelect({
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
  hideLabel = false,
}: CommandSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedItem = items.find(item => item.id === value);

  return (
    <div className={hideLabel ? undefined : "space-y-2"}>
      {!hideLabel && (
        <Label className="text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}

      <Popover open={open} onOpenChange={setOpen}>
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
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                      setOpen(false);
                      setSearchQuery('');
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
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
