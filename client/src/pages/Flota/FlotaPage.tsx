import { Ship } from 'lucide-react';
import { ModuleTabs } from '@/components/common/ModuleTabs';
import AlistamientoTab from './AlistamientoTab';
import BuquesTab from './BuquesTab';
import PersonalTab from './PersonalTab';

export default function FlotaPage() {
  return (
    <div className="w-full min-w-0">
      <div className="mb-6">
        <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800 dark:text-white">
          <Ship className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Flota y personal
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Buques, alistamiento mensual y personal
        </p>
      </div>

      <ModuleTabs
        defaultValue="buques"
        tabs={[
          { value: 'buques', label: 'Buques', content: <BuquesTab /> },
          { value: 'alistamiento', label: 'Alistamiento', content: <AlistamientoTab /> },
          { value: 'personal', label: 'Personal', content: <PersonalTab /> },
        ]}
      />
    </div>
  );
}
