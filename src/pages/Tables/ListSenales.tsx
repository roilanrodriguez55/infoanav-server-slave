import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { senalesService } from '../../services/api/senalesApi';

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
  Anchor
} from 'lucide-react';
import { Alert, AlertDescription } from '../../../@/components/ui/alert';

interface Senal {
  id_señal: string;
  codigo_lsm?: string;
  nombre?: string;
  tipo_nombre?: string;
  ubicación?: string;
  lumínica?: boolean;
  createat?: string;
  createby?: string;
}

const ListSenales = () => {
  const navigate = useNavigate();
  
  const [senales, setSenales] = useState<Senal[]>([]);
  const [filteredSenales, setFilteredSenales] = useState<Senal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSenal, setSelectedSenal] = useState<Senal | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadSenales = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await senalesService.getSenales();
      if (response.success) {
        setSenales(response.data || []);
        setFilteredSenales(response.data || []);
      } else {
        setError(response.message || 'Error al cargar las señales');
      }
    } catch (error: any) {
      console.error('Error cargando señales:', error);
      setError(error.message || 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSenales();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredSenales(senales);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = senales.filter(s => 
        s.codigo_lsm?.toLowerCase().includes(term) ||
        s.nombre?.toLowerCase().includes(term) ||
        s.tipo_nombre?.toLowerCase().includes(term) ||
        s.ubicación?.toLowerCase().includes(term)
      );
      setFilteredSenales(filtered);
    }
  }, [searchTerm, senales]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-ES');
  };

  const confirmDelete = (senal: Senal) => {
    setSelectedSenal(senal);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedSenal) return;
    
    setDeleteLoading(true);
    try {
      const response = await senalesService.deleteSenal(selectedSenal.id_señal);
      if (response.success) {
        setSenales(prev => prev.filter(s => s.id_señal !== selectedSenal.id_señal));
        setDeleteDialogOpen(false);
        setSelectedSenal(null);
        alert('✅ Señal eliminada correctamente');
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
    navigate(`/gestion-senales/editar/${id}`);
  };

  const handleNew = () => {
    navigate('/gestion-senales/nuevo');
  };

  const handleRefresh = () => {
    loadSenales();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando señales...</p>
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
            <Anchor className="h-5 w-5" />
            Señales Marítimas
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gestión de señales marítimas del sistema
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button 
            onClick={handleNew}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Señal
          </Button>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-blue-400 dark:text-gray-500" />
          </div>
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código, nombre, tipo..."
            className="pl-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
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

      <Card className="shadow-xl border-blue-200 dark:border-gray-700 dark:bg-gray-800">
        <CardHeader className="bg-white border-b border-blue-200 dark:bg-gray-800 dark:border-gray-700">
          <CardTitle className="text-xl text-gray-800 dark:text-white">
            Listado de Señales
            {filteredSenales.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                ({filteredSenales.length} registros)
              </span>
            )}
          </CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            Total de señales registradas en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredSenales.length === 0 ? (
            <div className="text-center py-12">
              <Anchor className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No hay señales
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchTerm ? 'No se encontraron resultados' : 'Comienza agregando una nueva señal'}
              </p>
              {!searchTerm && (
                <Button onClick={handleNew} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Señal
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-100 dark:bg-gray-700">
                    <TableHead className="font-semibold">Código LSM</TableHead>
                    <TableHead className="font-semibold">Nombre</TableHead>
                    <TableHead className="font-semibold">Tipo</TableHead>
                    <TableHead className="font-semibold">Ubicación</TableHead>
                    <TableHead className="font-semibold">Estado</TableHead>
                    <TableHead className="font-semibold">Fecha Creación</TableHead>
                    <TableHead className="font-semibold text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSenales.map((senal) => (
                    <TableRow key={senal.id_señal} className="hover:bg-blue-50 dark:hover:bg-gray-700">
                      <TableCell className="font-mono font-medium">
                        {senal.codigo_lsm || 'S/N'}
                      </TableCell>
                      <TableCell>{senal.nombre || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-100 dark:bg-gray-700">
                          {senal.tipo_nombre || 'No especificado'}
                        </Badge>
                      </TableCell>
                      <TableCell>{senal.ubicación || '-'}</TableCell>
                      <TableCell>
                        {senal.lumínica ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            Lumínica
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            No Lumínica
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(senal.createat)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(senal.id_señal)}
                            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => confirmDelete(senal)}
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
        <CardFooter className="flex justify-between border-t border-blue-200 dark:border-gray-700 bg-blue-50 dark:bg-gray-800/50 px-6 py-3">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Mostrando {filteredSenales.length} de {senales.length} señales
          </div>
        </CardFooter>
      </Card>

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la señal
              {selectedSenal && (
                <span className="font-semibold"> {selectedSenal.codigo_lsm || selectedSenal.nombre}</span>
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

export default ListSenales;