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
    <Card className="min-w-0 shadow-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800">
      <CardHeader className="bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <CardTitle className="text-xl text-gray-800 dark:text-white">{title}</CardTitle>
        {subtitle && (
          <CardDescription className="text-gray-500 dark:text-gray-400">{subtitle}</CardDescription>
        )}
        {actions && <CardAction>{actions}</CardAction>}
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
      {footer && (
        <CardFooter className="border-t border-gray-200 bg-transparent dark:border-gray-700 dark:bg-transparent px-6">
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}
