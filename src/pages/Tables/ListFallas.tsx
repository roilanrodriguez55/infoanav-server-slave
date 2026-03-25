import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fallasService } from '../../services/api/fallasApi';

// Componentes shadcn
import { Button } from '../../../@/components/ui/button';
import { Input } from '../../../@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '../../../@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../@/components/ui/alert-dialog';
import { Badge } from '../../../@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw,
  AlertCircle,
  User
} from 'lucide-react';
import { Alert, AlertDescription } from '../../../@/components/ui/alert';

interface Falla {
  id_falla: string;
  fecha_falla?: string;
  fecha_restablecer?: string;
  tipo_falla_nombre?: string;
  causa_de_falla?: string;
  rescatada?: boolean;
  reporto?: string;
  createat?: string;
  createby?: string;
}

const ListFallas: React.FC = () => {
  const navigate = useNavigate();
  
  const [fallas, setFallas] = useState<Falla[]>([]);
  const [filteredFallas, setFilteredFallas] = useState<Falla[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFalla, setSelectedFalla] = useState<Falla | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadFallas = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fallasService.getAll();
      if (response.success) {
        setFallas(response.data || []);
        setFilteredFallas(response.data || []);
      } else {
        setError(response.message || 'Error al cargar las fallas');
      }
    } catch (error: any) {
      console.error('Error cargando fallas:', error);
      setError(error.message || 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFallas();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredFallas(fallas);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = fallas.filter(f => 
        f.tipo_falla_nombre?.toLowerCase().includes(term) ||
        f.causa_de_falla?.toLowerCase().includes(term) ||
        f.reporto?.toLowerCase().includes(term)
      );
      setFilteredFallas(filtered);
    }
  }, [searchTerm, fallas]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-ES');
  };

  const confirmDelete = (falla: Falla) => {
    setSelectedFalla(falla);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedFalla) return;
    
    setDeleteLoading(true);
    try {
      const response = await fallasService.delete(selectedFalla.id_falla);
      if (response.success) {
        setFallas(prev => prev.filter(f => f.id_falla !== selectedFalla.id_falla));
        setDeleteDialogOpen(false);
        setSelectedFalla(null);
        alert('✅ Falla eliminada correctamente');
      } else {
        alert('❌ Error al eliminar: ' + (response.message || 'Error desconocido'));
      }
    } catch (error: any) {
      console.error('Error eliminando:', error);
      alert('❌ Error al conectar con el servidor');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/gestion-fallas/editar/${id}`);
  };

  const handleNew = () => {
    navigate('/gestion-fallas/nuevo');
  };

  const handleRefresh = () => {
    loadFallas();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Cargando fallas...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header con título y acciones */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Gestión de Fallas
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Administre las fallas registradas en el sistema
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            className="border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button 
            onClick={handleNew}
            className="bg-gray-800 hover:bg-gray-900 text-white dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Falla
          </Button>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por tipo, causa, responsable..."
            className="pl-10 border-gray-300 focus:border-gray-500 focus:ring-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
          />
        </div>
      </div>

      {error && (
        <Alert className="mb-6 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-700 dark:text-red-300">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <Card className="shadow-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800">
        <CardHeader className="bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <CardTitle className="text-xl text-gray-800 dark:text-white">
            Listado de Fallas
            {filteredFallas.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                ({filteredFallas.length} registros)
              </span>
            )}
          </CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            Total de fallas registradas en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredFallas.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No hay fallas
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchTerm ? 'No se encontraron resultados' : 'Comienza agregando una nueva falla'}
              </p>
              {!searchTerm && (
                <Button onClick={handleNew} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Falla
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100 dark:bg-gray-700">
                    <TableHead className="font-semibold">Fecha</TableHead>
                    <TableHead className="font-semibold">Tipo</TableHead>
                    <TableHead className="font-semibold">Causa</TableHead>
                    <TableHead className="font-semibold">Reportó</TableHead>
                    <TableHead className="font-semibold">Estado</TableHead>
                    <TableHead className="font-semibold text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFallas.map((falla) => (
                    <TableRow key={falla.id_falla} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <TableCell>{formatDate(falla.fecha_falla)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-gray-100 dark:bg-gray-700">
                          {falla.tipo_falla_nombre || 'No especificado'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {falla.causa_de_falla || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-gray-500" />
                          <span>{falla.reporto || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {falla.rescatada ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            Rescatada
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                            Pendiente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(falla.id_falla)}
                            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => confirmDelete(falla)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-6 py-3">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Mostrando {filteredFallas.length} de {fallas.length} fallas
          </div>
        </CardFooter>
      </Card>

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la falla
              {selectedFalla && (
                <span className="font-semibold"> del {formatDate(selectedFalla.fecha_falla)}</span>
              )}
              . Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ListFallas;