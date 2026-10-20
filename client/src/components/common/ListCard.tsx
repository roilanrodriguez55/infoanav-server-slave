import type { ReactNode } from 'react';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

interface ListCardProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

// Tarjeta de listado estandar: encabezado con borde inferior, contenido sin padding y pie opcional.
export function ListCard({ title, subtitle, actions, children, footer }: ListCardProps) {
  return (
    <Card className="min-w-0 shadow-xl border-border">
      <CardHeader className="bg-card border-b border-border">
        <CardTitle className="text-xl text-foreground">{title}</CardTitle>
        {subtitle && (
          <CardDescription className="text-muted-foreground">{subtitle}</CardDescription>
        )}
        {actions && <CardAction>{actions}</CardAction>}
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
      {footer && (
        <CardFooter className="border-t border-border bg-transparent px-6">
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}
