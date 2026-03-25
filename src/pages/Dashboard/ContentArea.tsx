import React from 'react';
import { useLocation } from 'react-router-dom';
import ListSenales from '../Tables/ListSenales';
import ListFallas from '../Tables//ListFallas';
import ListMantenimientos from '../Tables/ListManteniminetos';
import Dashboard from '../Dashboard/Dashboard';

const ContentArea = () => {
  const location = useLocation();
  const pathname = location.pathname;

  // Determinar qué componente mostrar según la ruta
  const getContent = () => {
    switch (pathname) {
      case '/dashboard':
      case '/':
        return <Dashboard />;
      case '/gestion-senales':
        return <ListSenales />;
      case '/gestion-fallas':
        return <ListFallas />;
      case '/gestion-mant':
        return <ListMantenimientos />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {getContent()}
      </div>
    </div>
  );
};

export default ContentArea;