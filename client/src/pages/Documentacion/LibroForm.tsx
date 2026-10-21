import { useState, type FormEvent, type ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { DatePickerField } from '@/components/common/DatePickerField';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CommandSelect } from '@/components/ui/CommandSelect';
import { CommandSelectCreable } from '@/components/ui/CommandSelectCreable';
import { Textarea } from '@/components/ui/textarea';
import {
  LIBRO_VACIO,
  documentacionService,
  libroACampos,
  libroATexto,
  type CatalogoCreable,
  type CatalogosLibros,
  type LibroRegistro,
  type LibroTexto,
} from '@/services/api/documentacionApi';
import type { CatalogoItem } from '@/services/api/senalesApi';
import { CAMPO_PENDIENTE, cn, esVacio } from '@/lib/utils';

type Clave = keyof LibroTexto;

interface LibroFormProps {
  libro: LibroRegistro | null;
  catalogos: CatalogosLibros;
  crearEn: (clave: CatalogoCreable) => (nombre: string) => Promise<CatalogoItem>;
  onTerminado: () => void;
  onCancelar: () => void;
}

const Grupo = ({ titulo, children }: { titulo: string; children: ReactNode }) => (
  <section className="space-y-4">
    <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-400">{titulo}</h3>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
  </section>
);

export default function LibroForm({ libro, catalogos, crearEn, onTerminado, onCancelar }: LibroFormProps) {
  const [valores, setValores] = useState<LibroTexto>(() => (libro ? libroATexto(libro) : LIBRO_VACIO));
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cambiar = (clave: Clave, valor: string) => {
    setValores((previo) => ({ ...previo, [clave]: valor }));
  };

  const campoTexto = (clave: Clave, etiqueta: string, tipo: 'text' | 'number' | 'date' = 'text', extra?: { step?: string; required?: boolean }) => (
    <div key={clave} className="space-y-2">
      <Label htmlFor={clave} className="text-sm font-medium">
        {etiqueta} {extra?.required && <span className="text-red-500">*</span>}
      </Label>
      {tipo === 'date' ? (
        <DatePickerField
          id={clave}
          value={valores[clave]}
          onChange={(valor) => cambiar(clave, valor)}
          className="w-full"
          inputClassName={cn('dark:border-gray-600 dark:bg-gray-800 dark:text-white', esVacio(valores[clave]) && CAMPO_PENDIENTE)}
        />
      ) : (
        <Input
          id={clave}
          type={tipo}
          step={extra?.step}
          value={valores[clave]}
          onChange={(e) => cambiar(clave, e.target.value)}
          className={cn(
            'dark:border-gray-600 dark:bg-gray-800 dark:text-white',
            esVacio(valores[clave]) && CAMPO_PENDIENTE
          )}
        />
      )}
    </div>
  );

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    const campos = libroACampos(valores);
    const respuesta = libro
      ? await documentacionService.update(libro.id_libro, campos)
      : await documentacionService.create(campos);
    setGuardando(false);
    if (respuesta.success) {
      onTerminado();
    } else {
      setError(respuesta.message);
    }
  };

  return (
    <form onSubmit={guardar} className="space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <AlertDescription className="text-red-700 dark:text-red-300">{error}</AlertDescription>
        </Alert>
      )}

      <Grupo titulo="Identificación">
        {campoTexto('titulo', 'Título', 'text', { required: true })}
        {campoTexto('codigo', 'Código')}
        <CommandSelect
          label="Tipo de documento"
          placeholder="Seleccione un tipo"
          searchPlaceholder="Buscar tipo..."
          items={catalogos.tiposDocumento}
          value={valores.id_tipo_documento}
          onValueChange={(valor) => cambiar('id_tipo_documento', valor)}
          pendiente={esVacio(valores.id_tipo_documento)}
        />
        <CommandSelectCreable
          label="Tema"
          placeholder="Seleccione un tema"
          searchPlaceholder="Buscar o escribir tema..."
          items={catalogos.temas}
          value={valores.id_tema}
          onValueChange={(valor) => cambiar('id_tema', valor)}
          pendiente={esVacio(valores.id_tema)}
          onCrear={crearEn('temas')}
        />
        <CommandSelect
          label="Idioma"
          placeholder="Seleccione un idioma"
          searchPlaceholder="Buscar idioma..."
          items={catalogos.idiomas}
          value={valores.id_idioma}
          onValueChange={(valor) => cambiar('id_idioma', valor)}
          pendiente={esVacio(valores.id_idioma)}
        />
        {campoTexto('nivel', 'Nivel')}
        {campoTexto('paginas', 'Páginas')}
      </Grupo>

      <Grupo titulo="Autoría y edición">
        {campoTexto('autor_nombre', 'Nombre del autor')}
        {campoTexto('autor_apellidos', 'Apellidos del autor')}
        <CommandSelectCreable
          label="Editorial"
          placeholder="Seleccione una editorial"
          searchPlaceholder="Buscar o escribir editorial..."
          items={catalogos.editoriales}
          value={valores.id_editorial}
          onValueChange={(valor) => cambiar('id_editorial', valor)}
          pendiente={esVacio(valores.id_editorial)}
          onCrear={crearEn('editoriales')}
        />
        <CommandSelectCreable
          label="País"
          placeholder="Seleccione un país"
          searchPlaceholder="Buscar o escribir país..."
          items={catalogos.paises}
          value={valores.id_pais}
          onValueChange={(valor) => cambiar('id_pais', valor)}
          pendiente={esVacio(valores.id_pais)}
          onCrear={crearEn('paises')}
        />
        {campoTexto('ano_publicacion', 'Año de publicación', 'number')}
      </Grupo>

      <Grupo titulo="Ejemplar">
        {campoTexto('estado_tecnico', 'Estado técnico')}
        {campoTexto('ubicacion', 'Ubicación')}
        {campoTexto('precio', 'Precio', 'number', { step: '0.01' })}
        {campoTexto('tipo_portada', 'Tipo de portada')}
        {campoTexto('fecha_compra', 'Fecha de compra', 'date')}
      </Grupo>

      <Grupo titulo="Notas">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notas" className="text-sm font-medium">Notas</Label>
          <Textarea
            id="notas"
            value={valores.notas}
            onChange={(e) => cambiar('notas', e.target.value)}
            className={cn('dark:border-gray-600 dark:bg-gray-800 dark:text-white', esVacio(valores.notas) && CAMPO_PENDIENTE)}
          />
        </div>
      </Grupo>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="brand"
          disabled={guardando || esVacio(valores.titulo)}
        >
          {guardando ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </form>
  );
}
