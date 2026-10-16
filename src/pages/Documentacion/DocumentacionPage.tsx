import { BookOpen } from 'lucide-react';
import { ModuleTabs } from '@/components/common/ModuleTabs';
import LibrosTab from './LibrosTab';
import PrestamosTab from './PrestamosTab';

export default function DocumentacionPage() {
  return (
    <div className="w-full min-w-0">
      <div className="mb-6">
        <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800 dark:text-white">
          <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Documentación
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Biblioteca de libros y control de préstamos
        </p>
      </div>

      <ModuleTabs
        defaultValue="libros"
        tabs={[
          { value: 'libros', label: 'Libros', content: <LibrosTab /> },
          { value: 'prestamos', label: 'Préstamos', content: <PrestamosTab /> },
        ]}
      />
    </div>
  );
}
