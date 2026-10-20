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
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center text-gray-400 dark:text-gray-600 [&>svg]:h-12 [&>svg]:w-12">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
      {description && (
        <p className={cn('text-gray-500 dark:text-gray-400', action && 'mb-4')}>{description}</p>
      )}
      {action}
    </div>
  );
}
