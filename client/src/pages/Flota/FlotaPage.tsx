import { Ship } from 'lucide-react';
import { ModuleTabs } from '@/components/common/ModuleTabs';
import { PageHeader } from '@/components/common/PageHeader';
import AlistamientoTab from './AlistamientoTab';
import BuquesTab from './BuquesTab';
import PersonalTab from './PersonalTab';

export default function FlotaPage() {
  return (
    <div className="w-full min-w-0">
      <PageHeader
        icon={<Ship />}
        title="Flota y personal"
        subtitle="Buques, alistamiento mensual y personal"
      />

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
