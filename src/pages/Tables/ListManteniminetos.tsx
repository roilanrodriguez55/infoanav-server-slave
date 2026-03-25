import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mantenimientosService } from '../../services/api/mantenApi';

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
  Wrench,
  User
} from 'lucide-react';
import { Alert, AlertDescription } from '../../../@/components/ui/alert';

interface TiempoEmpleado {
  hours?: number;
  minutes?: number;
  seconds?: number;
}

interface Mantenimiento {
  id_mantenimiento: string;
  id_tipo_mant?: string;
  tipo_mantenimiento_nombre?: string;
  ident_mantenimiento?: string;
  fecha_inicio?: string;
  fecha_finalizacion?: string;
  tiempo_empleado?: TiempoEmpleado | number | null;
  aseguro?: string;
  id_estado_senal?: string;
  estado_senal_nombre?: string;
  trabajo_realizado?: string;
  costo_mn?: string | number;
  costo_mlc?: string | number;
  diesel_lit?: string | number;
  gasolina_lit?: string | number;
  informa?: string;
  transmite?: string;
  rg?: string;
  orden?: string;
  introdujo?: string;
  createat?: string;
  createby?: string;
  updateat?: string | null;
  updateby?: string | null;
  deleteat?: string | null;
  deleteby?: string | null;
}

const ListMantenimientos: React.FC = () => {
  const navigate = useNavigate();
  
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [filteredMantenimientos, setFilteredMantenimientos] = useState<Mantenimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMantenimiento, setSelectedMantenimiento] = useState<Mantenimiento | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadMantenimientos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await mantenimientosService.getAll();
      if (response.success) {
        setMantenimientos(response.data || []);
        setFilteredMantenimientos(response.data || []);
      } else {
        setError(response.message || 'Error al cargar los mantenimientos');
      }
    } catch (error: any) {
      console.error('Error cargando mantenimientos:', error);
      setError(error.message || 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMantenimientos();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredMantenimientos(mantenimientos);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = mantenimientos.filter(m => 
        m.ident_mantenimiento?.toLowerCase().includes(term) ||
        m.tipo_mantenimiento_nombre?.toLowerCase().includes(term) ||
        m.trabajo_realizado?.toLowerCase().includes(term) ||
        m.informa?.toLowerCase().includes(term) ||
        m.aseguro?.toLowerCase().includes(term)
      );
      setFilteredMantenimientos(filtered);
    }
  }, [searchTerm, mantenimientos]);

  const getHoras = (tiempo?: TiempoEmpleado | number | null): number => {
    if (!tiempo) return 0;
    if (typeof tiempo === 'number') return tiempo;
    if (typeof tiempo === 'object' && tiempo !== null) {
      return tiempo.hours || 0;
    }
    return 0;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-ES');
  };

  const formatCurrency = (value?: string | number) => {
    if (value === undefined || value === null) return '$0.00';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `$${num.toFixed(2)}`;
  };

  const confirmDelete = (mantenimiento: Mantenimiento) => {
    setSelectedMantenimiento(mantenimiento);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedMantenimiento) return;
    
    setDeleteLoading(true);
    try {
      const response = await mantenimientosService.delete(selectedMantenimiento.id_mantenimiento);
      if (response.success) {
        setMantenimientos(prev => prev.filter(m => m.id_mantenimiento !== selectedMantenimiento.id_mantenimiento));
        setDeleteDialogOpen(false);
        setSelectedMantenimiento(null);
        alert('✅ Mantenimiento eliminado correctamente');
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
    navigate(`/gestion-mant/editar/${id}`);
  };

  const handleNew = () => {
    navigate('/gestion-mant/nuevo');
  };

  const handleRefresh = () => {
    loadMantenimientos();
  };

  const getTiempoBadge = (tiempo?: TiempoEmpleado | number | null) => {
    const horas = getHoras(tiempo);
    if (horas === 0) return <Badge variant="outline">-</Badge>;
    if (horas < 2) return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">{horas}h</Badge>;
    if (horas < 5) return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">{horas}h</Badge>;
    return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">{horas}h</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Cargando mantenimientos...</p>
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
            <Wrench className="h-5 w-5" />
            Gestión de Mantenimientos
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Administre los mantenimientos de las señales marítimas
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
            Nuevo Mantenimiento
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
            placeholder="Buscar por ID, tipo, responsable..."
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
            Listado de Mantenimientos
            {filteredMantenimientos.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                ({filteredMantenimientos.length} registros)
              </span>
            )}
          </CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            Total de mantenimientos registrados en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredMantenimientos.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No hay mantenimientos
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchTerm ? 'No se encontraron resultados para tu búsqueda' : 'Comienza agregando un nuevo mantenimiento'}
              </p>
              {!searchTerm && (
                <Button onClick={handleNew} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Mantenimiento
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100 dark:bg-gray-700">
                    <TableHead className="font-semibold">ID</TableHead>
                    <TableHead className="font-semibold">Tipo</TableHead>
                    <TableHead className="font-semibold">Fecha Inicio</TableHead>
                    <TableHead className="font-semibold">Tiempo</TableHead>
                    <TableHead className="font-semibold">Trabajo Realizado</TableHead>
                    <TableHead className="font-semibold">Responsable</TableHead>
                    <TableHead className="font-semibold text-right">Costo MN</TableHead>
                    <TableHead className="font-semibold text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMantenimientos.map((mant) => (
                    <TableRow key={mant.id_mantenimiento} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <TableCell className="font-medium">
                        {mant.ident_mantenimiento || 'S/N'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-gray-100 dark:bg-gray-700">
                          {mant.tipo_mantenimiento_nombre || 'No especificado'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDate(mant.fecha_inicio)}
                      </TableCell>
                      <TableCell>
                        {getTiempoBadge(mant.tiempo_empleado)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {mant.trabajo_realizado || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-gray-500" />
                          <span>{mant.informa || mant.aseguro || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(mant.costo_mn)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(mant.id_mantenimiento)}
                            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => confirmDelete(mant)}
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
            Mostrando {filteredMantenimientos.length} de {mantenimientos.length} mantenimientos
          </div>
        </CardFooter>
      </Card>

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el mantenimiento
              {selectedMantenimiento && (
                <span className="font-semibold"> {selectedMantenimiento.ident_mantenimiento || 'S/N'}</span>
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

export default ListMantenimientos;