import { useState, type FormEvent } from 'react';
import { DetailPanel } from '@/components/common/DetailPanel';
import { CommandSelect } from '@/components/ui/CommandSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save } from 'lucide-react';
import { planMantService, type PlanMantenimiento, type PlanMantenimientoData } from '@/services/api/planMantApi';
import { aTimestampLocal, type SenalOpcion, type TipoOpcion } from '@/lib/planMantenimiento';
import { aValorDatetimeLocal } from '@/lib/intervalos';
import { CAMPO_PENDIENTE, cn, esVacio, etiquetaSenal } from '@/lib/utils';

interface FormPlan {
  id_senal: string;
  id_tipo_mant: string;
  fecha_plan: string;
  trabajo_medios: string;
  observaciones: string;
}

interface PlanFormPanelProps {
  plan: PlanMantenimiento | null;
  senales: SenalOpcion[];
  tipos: TipoOpcion[];
  onCerrar: () => void;
  onGuardado: () => void;
}

const formularioDe = (plan: PlanMantenimiento | null): FormPlan => ({
  id_senal: plan?.id_senal ?? '',
  id_tipo_mant: plan?.id_tipo_mant ?? '',
  fecha_plan: aValorDatetimeLocal(plan?.fecha_plan ?? null),
  trabajo_medios: plan?.trabajo_medios ?? '',
  observaciones: plan?.observaciones ?? '',
});

const CLASE_CAMPO = 'border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400';

// Se monta al abrir (la pagina usa key) para partir siempre del plan recibido.
export function PlanFormPanel({ plan, senales, tipos, onCerrar, onGuardado }: PlanFormPanelProps) {
  const [form, setForm] = useState<FormPlan>(() => formularioDe(plan));
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const actualizar = (campo: keyof FormPlan, valor: string) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const opcionesSenal = senales.map((senal) => ({ id: senal.id_senal, nombre: etiquetaSenal(senal.codigo_lsm, senal.nombre) }));
  const opcionesTipo = tipos.map((tipo) => ({ id: tipo.id_tipo_mant, nombre: tipo.nombre }));

  const guardar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.id_senal) {
      setError('La señal es obligatoria');
      return;
    }

    setGuardando(true);
    setError(null);

    const datos: PlanMantenimientoData = {
      id_senal: form.id_senal,
      id_tipo_mant: form.id_tipo_mant || null,
      fecha_plan: aTimestampLocal(form.fecha_plan),
      trabajo_medios: form.trabajo_medios || null,
      observaciones: form.observaciones || null,
    };

    const respuesta = plan
      ? await planMantService.update(plan.id_plan_mantenimiento, datos)
      : await planMantService.create(datos);

    setGuardando(false);
    if (!respuesta.success) {
      setError(respuesta.message || 'No se pudo guardar el plan');
      return;
    }

    onGuardado();
    onCerrar();
  };

  return (
    <DetailPanel
      open
      onOpenChange={(abierto) => {
        if (!abierto) onCerrar();
      }}
      title={plan ? 'Editar plan de mantenimiento' : 'Planificar mantenimiento'}
      description="Programe un mantenimiento para una señal en una fecha determinada."
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" form="form-plan-mantenimiento" disabled={guardando}>
            {guardando ? <Loader2 className="animate-spin" /> : <Save />}
            {plan ? 'Actualizar' : 'Guardar'}
          </Button>
        </div>
      }
    >
      <form id="form-plan-mantenimiento" onSubmit={guardar} className="space-y-5">
        <CommandSelect
          value={form.id_senal}
          onValueChange={(valor) => actualizar('id_senal', valor)}
          placeholder="Seleccionar señal"
          searchPlaceholder="Buscar señal..."
          emptyMessage="No se encontraron señales"
          items={opcionesSenal}
          label="Señal"
          required
          pendiente={esVacio(form.id_senal)}
        />

        <CommandSelect
          value={form.id_tipo_mant}
          onValueChange={(valor) => actualizar('id_tipo_mant', valor)}
          placeholder="Seleccionar tipo de mantenimiento"
          searchPlaceholder="Buscar tipo..."
          emptyMessage="No se encontraron tipos de mantenimiento"
          items={opcionesTipo}
          label="Tipo de mantenimiento"
          pendiente={esVacio(form.id_tipo_mant)}
        />

        <div className="space-y-2">
          <Label htmlFor="plan_fecha" className="text-gray-700 dark:text-gray-300 font-medium">
            Fecha planificada
          </Label>
          <Input
            id="plan_fecha"
            type="datetime-local"
            value={form.fecha_plan}
            onChange={(e) => actualizar('fecha_plan', e.target.value)}
            className={cn(CLASE_CAMPO, esVacio(form.fecha_plan) && CAMPO_PENDIENTE)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="plan_trabajo" className="text-gray-700 dark:text-gray-300 font-medium">
            Trabajo y medios
          </Label>
          <Textarea
            id="plan_trabajo"
            rows={4}
            value={form.trabajo_medios}
            onChange={(e) => actualizar('trabajo_medios', e.target.value)}
            placeholder="Trabajo a realizar y medios necesarios"
            className={cn(CLASE_CAMPO, esVacio(form.trabajo_medios) && CAMPO_PENDIENTE)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="plan_observaciones" className="text-gray-700 dark:text-gray-300 font-medium">
            Observaciones
          </Label>
          <Textarea
            id="plan_observaciones"
            rows={3}
            value={form.observaciones}
            onChange={(e) => actualizar('observaciones', e.target.value)}
            className={cn(CLASE_CAMPO, esVacio(form.observaciones) && CAMPO_PENDIENTE)}
          />
        </div>

        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </p>
        )}
      </form>
    </DetailPanel>
  );
}
