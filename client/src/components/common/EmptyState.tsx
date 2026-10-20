import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

// Estado vacio de listados: icono grande gris, titulo, descripcion y accion opcional.
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center text-icon/70 [&>svg]:h-12 [&>svg]:w-12">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      {description && (
        <p className={cn('text-muted-foreground', action && 'mb-4')}>{description}</p>
      )}
      {action}
    </div>
  );
}
