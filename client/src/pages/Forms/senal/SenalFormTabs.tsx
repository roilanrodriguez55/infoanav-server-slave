import type { ReactNode } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SenalFormTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  luminica: boolean;
  esBoya: boolean;
  children: ReactNode;
}

export const SenalFormTabs = ({ activeTab, onTabChange, luminica, esBoya, children }: SenalFormTabsProps) => (
  <Tabs value={activeTab} onValueChange={onTabChange} className="mb-6">
    <TabsList className="grid grid-cols-6 bg-blue-100 dark:bg-gray-700">
      <TabsTrigger
        value="generales"
        className="data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:data-[state=active]:bg-blue-600 dark:text-gray-300"
      >
        Datos Generales
      </TabsTrigger>
      <TabsTrigger
        value="geograficos"
        className="data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:data-[state=active]:bg-blue-600 dark:text-gray-300"
      >
        Datos Geográficos
      </TabsTrigger>
      <TabsTrigger
        value="luminicos"
        disabled={!luminica}
        className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[disabled]:opacity-50 dark:data-[state=active]:bg-blue-600 dark:text-gray-300"
      >
        Datos Lumínicos
      </TabsTrigger>
      <TabsTrigger
        value="equipamiento"
        disabled={!luminica}
        className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[disabled]:opacity-50 dark:data-[state=active]:bg-blue-600 dark:text-gray-300"
      >
        Equipamiento
      </TabsTrigger>
      <TabsTrigger
        value="fondeo"
        disabled={!esBoya}
        className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[disabled]:opacity-50 dark:data-[state=active]:bg-blue-600 dark:text-gray-300"
      >
        Sistema de Fondeo
      </TabsTrigger>
      <TabsTrigger
        value="radioelectrica"
        className="data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:data-[state=active]:bg-blue-600 dark:text-gray-300"
      >
        Radioeléctrica
      </TabsTrigger>
    </TabsList>

    {children}
  </Tabs>
);
