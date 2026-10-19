import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, HandCoins, Undo2, Pencil } from 'lucide-react';
import type { LibroRegistro } from '@/services/api/documentacionApi';
import { fechaCorta } from './documentacionFormato';
import PrestarDialog from './PrestarDialog';
import DevolverDialog from './DevolverDialog';

interface LibroFichaProps {
  libro: LibroRegistro;
  onEditar: () => void;
  onCambio: () => void;
}

const Dato = ({ etiqueta, children }: { etiqueta: string; children: ReactNode }) => (
  <div>
    <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">{etiqueta}</dt>
    <dd className="text-sm text-gray-800 dark:text-gray-100">{children ?? '-'}</dd>
  </div>
);

export default function LibroFicha({ libro, onEditar, onCambio }: LibroFichaProps) {
  const [dialogo, setDialogo] = useState<'prestar' | 'devolver' | null>(null);

  const terminado = () => {
    setDialogo(null);
    onCambio();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-white">
          <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          {libro.titulo}
        </h3>
        {libro.prestado ? (
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">Prestado</Badge>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              A {libro.a_quien_abierto ?? '-'}, devolver antes del {fechaCorta(libro.fecha_a_devolver_abierto)}
            </span>
            {libro.prestamo_vencido && (
              <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Vencido</Badge>
            )}
          </div>
        ) : (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Disponible</Badge>
        )}
      </div>

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Dato etiqueta="Código">{libro.codigo}</Dato>
        <Dato etiqueta="Tipo de documento">{libro.tipo_documento_nombre}</Dato>
        <Dato etiqueta="Tema">{libro.tema_nombre}</Dato>
        <Dato etiqueta="Idioma">{libro.idioma_nombre}</Dato>
        <Dato etiqueta="Autor">
          {[libro.autor_nombre, libro.autor_apellidos].filter(Boolean).join(' ') || null}
        </Dato>
        <Dato etiqueta="Editorial">{libro.editorial_nombre}</Dato>
        <Dato etiqueta="País">{libro.pais_nombre}</Dato>
        <Dato etiqueta="Año de publicación">{libro.ano_publicacion}</Dato>
        <Dato etiqueta="Páginas">{libro.paginas}</Dato>
        <Dato etiqueta="Nivel">{libro.nivel}</Dato>
        <Dato etiqueta="Estado técnico">{libro.estado_tecnico}</Dato>
        <Dato etiqueta="Ubicación">{libro.ubicacion}</Dato>
        <Dato etiqueta="Precio">{libro.precio === null ? null : libro.precio.toFixed(2)}</Dato>
        <Dato etiqueta="Tipo de portada">{libro.tipo_portada}</Dato>
        <Dato etiqueta="Fecha de compra">{fechaCorta(libro.fecha_compra)}</Dato>
        <Dato etiqueta="Notas">{libro.notas}</Dato>
      </dl>

      <div className="flex flex-wrap gap-2 border-t pt-4">
        <Button variant="outline" onClick={onEditar}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </Button>
        {libro.prestado ? (
          <Button
            onClick={() => setDialogo('devolver')}
            disabled={!libro.id_prestamo_abierto}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <Undo2 className="mr-2 h-4 w-4" />
            Devolver
          </Button>
        ) : (
          <Button onClick={() => setDialogo('prestar')} className="bg-blue-600 text-white hover:bg-blue-700">
            <HandCoins className="mr-2 h-4 w-4" />
            Prestar
          </Button>
        )}
      </div>

      {dialogo === 'prestar' && (
        <PrestarDialog libro={libro} onOpenChange={(abierto) => !abierto && setDialogo(null)} onTerminado={terminado} />
      )}
      {dialogo === 'devolver' && libro.id_prestamo_abierto && (
        <DevolverDialog
          idPrestamo={libro.id_prestamo_abierto}
          descripcion={`${libro.titulo} (a ${libro.a_quien_abierto ?? '-'})`}
          onOpenChange={(abierto) => !abierto && setDialogo(null)}
          onTerminado={terminado}
        />
      )}
    </div>
  );
}
