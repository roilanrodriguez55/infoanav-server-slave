import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../@/components/ui/tabs';
import ListSenales from '../Tables/ListSenales';
import ListFallas from '../Tables/ListFallas';
import ListMantenimientos from '../Tables/ListManteniminetos';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('senales');

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Panel de Administración
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gestión Integral de Señalización Marítima - ANAV
        </p>
      </div>

    </div>
  );
};

export default Dashboard;