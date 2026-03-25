import React, { useState } from 'react';
import { Check, ChevronsUpDown, Plus, Loader2 } from 'lucide-react';
import { cn } from '../../../@/libs/utils';

// Componentes shadcn
import { Button } from '../../../@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../../../@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../../@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../@/components/ui/dialog';
import { Input } from '../../../@/components/ui/input';
import { Label } from '../../../@/components/ui/label';

interface Item {
  id: string;
  nombre: string;
}

interface CommandSelectWithAddProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  items: Item[];
  onAddItem: (nombre: string) => Promise<Item>;
  label: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function CommandSelectWithAdd({
  value,
  onValueChange,
  placeholder,
  searchPlaceholder = "Buscar...",
  emptyMessage = "No se encontraron resultados.",
  items,
  onAddItem,
  label,
  required = false,
  disabled = false,
  className = "",
}: CommandSelectWithAddProps) {
  const [open, setOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedItem = items.find(item => item.id === value);

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      setError('El nombre es requerido');
      return;
    }

    setIsAdding(true);
    setError('');

    try {
      const newItem = await onAddItem(newItemName);
      
      // Seleccionar el nuevo item automáticamente
      onValueChange(newItem.id);
      
      // Cerrar diálogos y limpiar
      setIsDialogOpen(false);
      setOpen(false);
      setNewItemName('');
      setSearchQuery('');
    } catch (err: any) {
      setError(err.message || 'Error al agregar el item');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between h-10 font-normal",
              !value && "text-muted-foreground",
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
                {/* Opción para agregar nuevo item */}
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    setIsDialogOpen(true);
                  }}
                  className="text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span>Agregar nuevo {label.toLowerCase()}...</span>
                </CommandItem>
                
                {/* Items existentes */}
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

      {/* Diálogo para agregar nuevo item */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar nuevo {label.toLowerCase()}</DialogTitle>
            <DialogDescription>
              Ingrese el nombre del nuevo {label.toLowerCase()} que desea agregar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newItemName">Nombre</Label>
              <Input
                id="newItemName"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder={`Ingrese el nombre del ${label.toLowerCase()}`}
                autoFocus
              />
            </div>
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setNewItemName('');
                setError('');
              }}
              disabled={isAdding}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleAddItem}
              disabled={isAdding}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isAdding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Agregando...
                </>
              ) : (
                'Agregar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}