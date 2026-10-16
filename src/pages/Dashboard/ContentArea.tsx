import { useLocation } from 'react-router-dom';
import ListSenales from '@/pages/Tables/ListSenales';
import ListFallas from '@/pages/Tables/ListFallas';
import ListMantenimientos from '@/pages/Tables/ListMantenimientos';
import Dashboard from '@/pages/Dashboard/Dashboard';

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

  return <div className="mx-auto">{getContent()}</div>;
};

export default ContentArea;