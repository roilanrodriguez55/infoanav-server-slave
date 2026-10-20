import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  icon: ReactNode;
  iconClassName?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children?: ReactNode;
}

// Encabezado estandar de pagina: titulo con icono, acciones a la derecha y zona opcional debajo (pestañas).
export function PageHeader({ icon, iconClassName, title, subtitle, actions, children }: PageHeaderProps) {
  return (
    <>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <span className={cn('inline-flex h-5 w-5 shrink-0 text-icon-strong [&>svg]:h-5 [&>svg]:w-5', iconClassName)}>
              {icon}
            </span>
            {title}
          </h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>

        {actions && <div className="flex flex-col sm:flex-row gap-2">{actions}</div>}
      </div>

      {children && <div className="mb-6">{children}</div>}
    </>
  );
}
