import { FileText } from 'lucide-react';
import { ModuleTabs } from '@/components/common/ModuleTabs';
import { PageHeader } from '@/components/common/PageHeader';
import LibrosTab from './LibrosTab';
import PrestamosTab from './PrestamosTab';

export default function DocumentacionPage() {
  return (
    <div className="w-full min-w-0">
      <PageHeader
        icon={<FileText />}
        iconClassName="text-blue-600 dark:text-blue-400"
        title="Documentación"
        subtitle="Biblioteca de libros y control de préstamos"
      />

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
