import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface PillTab {
  value: string;
  label: string;
  disabled?: boolean;
  badge?: ReactNode;
}

interface PillTabsProps {
  tabs: PillTab[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  'aria-label'?: string;
}

// Pestañas en pildora compacta, controladas por el padre.
export function PillTabs({ tabs, value, onChange, className, 'aria-label': ariaLabel }: PillTabsProps) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1',
        className
      )}
    >
      {tabs.map((tab) => {
        const activa = value === tab.value;
        return (
          <Button
            key={tab.value}
            size="sm"
            aria-pressed={activa}
            disabled={tab.disabled}
            onClick={() => onChange(tab.value)}
            className={activa
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-transparent text-foreground/80 hover:bg-muted'}
          >
            {tab.label}
            {tab.badge}
          </Button>
        );
      })}
    </div>
  );
}
