import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CommandSelect } from '@/components/ui/CommandSelect';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ESQUEMA_PERSONAL,
  aCampos,
  aTextos,
  flotaService,
  textosVacios,
  type CampoPersonal,
  type PersonaRegistro,
  type Texto,
} from '@/services/api/flotaApi';
import type { CatalogoItem } from '@/services/api/senalesApi';
import { CAMPO_PENDIENTE, cn, esVacio } from '@/lib/utils';
import { CampoFlota } from './CampoFlota';

interface PersonaFormProps {
  persona: PersonaRegistro | null;
  onTerminado: () => void;
  onCancelar: () => void;
}

const ETIQUETAS: Record<CampoPersonal, string> = {
  id_empresa: 'Empresa',
  nombre: 'Nombre',
  primer_apellido: 'Primer apellido',
  segundo_apellido: 'Segundo apellido',
  cargo: 'Cargo',
  radica_en: 'Radica en',
  telefono: 'Teléfono',
  carne_identidad: 'Carné de identidad',
  fecha_nacimiento: 'Fecha de nacimiento',
  salario: 'Salario',
  escolaridad: 'Escolaridad',
  cargos_anteriores: 'Cargos anteriores',
  cursos_recibidos: 'Cursos recibidos',
  necesidad_cursos: 'Necesidad de cursos',
  fecha_baja: 'Fecha de baja',
  causa_baja: 'Causa de baja',
};

// Campos de texto largo, que se muestran como area de texto.
const AREAS: CampoPersonal[] = ['cargos_anteriores', 'cursos_recibidos', 'necesidad_cursos'];

// La baja y su causa no se editan aqui: tienen acciones propias (dar baja, reactivar).
// Se conservan los valores que trae el registro para que el guardado no los cambie.
export default function PersonaForm({ persona, onTerminado, onCancelar }: PersonaFormProps) {
  const [texto, setTexto] = useState<Texto<CampoPersonal>>(() =>
    persona ? aTextos(ESQUEMA_PERSONAL, persona) : textosVacios(ESQUEMA_PERSONAL)
  );
  const [empresas, setEmpresas] = useState<CatalogoItem[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void flotaService.getCatalogos().then((catalogos) => setEmpresas(catalogos.empresas)).catch(() => undefined);
  }, []);

  const cambiar = (campo: CampoPersonal, valor: string) => {
    setTexto((previo) => ({ ...previo, [campo]: valor }));
  };

  const campo = (clave: CampoPersonal) =>
    AREAS.includes(clave) ? (
      <div key={clave} className="space-y-2 sm:col-span-2">
        <Label htmlFor={clave} className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {ETIQUETAS[clave]}
        </Label>
        <Textarea
          id={clave}
          rows={3}
          value={texto[clave]}
          onChange={(evento) => cambiar(clave, evento.target.value)}
          className={cn('dark:border-gray-600 dark:bg-gray-800 dark:text-white', esVacio(texto[clave]) && CAMPO_PENDIENTE)}
        />
      </div>
    ) : (
      <CampoFlota
        key={clave}
        id={clave}
        etiqueta={ETIQUETAS[clave]}
        valor={texto[clave]}
        tipo={ESQUEMA_PERSONAL[clave]}
        onCambiar={(valor) => cambiar(clave, valor)}
      />
    );

  const guardar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (esVacio(texto.primer_apellido)) {
      setError('El primer apellido es obligatorio.');
      return;
    }

    setGuardando(true);
    setError(null);
    const respuesta = await flotaService.guardarPersona(persona?.id_persona ?? null, aCampos(ESQUEMA_PERSONAL, texto));
    setGuardando(false);

    if (!respuesta.success) {
      setError(respuesta.message);
      return;
    }
    onTerminado();
  };

  const camposEdicion = (Object.keys(ESQUEMA_PERSONAL) as CampoPersonal[]).filter(
    (clave) => clave !== 'fecha_baja' && clave !== 'causa_baja'
  );

  return (
    <form onSubmit={guardar} className="space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-700 dark:text-red-300">{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CommandSelect
          value={texto.id_empresa}
          onValueChange={(valor) => cambiar('id_empresa', valor)}
          placeholder="Seleccionar empresa"
          searchPlaceholder="Buscar empresa..."
          emptyMessage="No se encontraron empresas"
          items={empresas}
          label="Empresa"
          pendiente={esVacio(texto.id_empresa)}
        />
        {camposEdicion.filter((clave) => clave !== 'id_empresa').map((clave) => campo(clave))}
      </div>

      <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
        <Button type="button" variant="outline" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </Button>
        <Button type="submit" variant="brand" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </form>
  );
}
