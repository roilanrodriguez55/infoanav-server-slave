import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { contarPlanesVencidos } from "@/services/api/planMantApi";
import { equiposService } from "@/services/api/equiposApi";
import { contarHechosPendientes } from "@/services/api/hechosApi";
import { contarAlertasCertificados } from "@/services/api/flotaApi";
import { contarPrestamosVencidos } from "@/services/api/documentacionApi";

type Tono = "danger" | "warning";

interface Contador {
  valor: number | null;
  cargando: boolean;
}

// Las funciones se pasan como constantes de modulo: el efecto no debe re-ejecutarse en cada render.
const cargarEquipos = () => equiposService.contarAlertasEquipos();

// Cada contador tiene su propio estado. Si falla, valor queda en null y la tarjeta muestra "—".
function useContador(cargar: () => Promise<number>): Contador {
  const [estado, setEstado] = useState<Contador>({ valor: null, cargando: true });
  useEffect(() => {
    let vigente = true;
    cargar()
      .then((valor) => {
        if (vigente) setEstado({ valor, cargando: false });
      })
      .catch(() => {
        if (vigente) setEstado({ valor: null, cargando: false });
      });
    return () => {
      vigente = false;
    };
  }, [cargar]);
  return estado;
}

const COLOR_VALOR: Record<Tono, string> = {
  danger: "text-red-600 dark:text-red-400",
  warning: "text-amber-600 dark:text-amber-400",
};

interface TarjetaAlertaProps {
  titulo: string;
  detalle: string;
  to: string;
  tono: Tono;
  valor: number | null;
  cargando: boolean;
}

function TarjetaAlerta({ titulo, detalle, to, tono, valor, cargando }: TarjetaAlertaProps) {
  const color = valor === 0 ? "text-gray-900 dark:text-white" : COLOR_VALOR[tono];
  return (
    <Link
      to={to}
      className="relative block rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-white/5"
    >
      {cargando && <Loader2 className="absolute top-2 right-2 h-4 w-4 animate-spin text-icon" />}
      <p className="text-xs text-gray-500 dark:text-gray-400">{titulo}</p>
      <p className={`mt-1 text-2xl font-semibold ${color}`}>
        {cargando ? "..." : valor ?? "—"}
      </p>
      <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{detalle} ↗</p>
    </Link>
  );
}

interface TarjetasAlertasProps {
  fueraServicio: number | null;
  cargandoFueraServicio: boolean;
}

export function TarjetasAlertas({ fueraServicio, cargandoFueraServicio }: TarjetasAlertasProps) {
  const planes = useContador(contarPlanesVencidos);
  const equipos = useContador(cargarEquipos);
  const hechos = useContador(contarHechosPendientes);
  const certificados = useContador(contarAlertasCertificados);
  const prestamos = useContador(contarPrestamosVencidos);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <TarjetaAlerta
        titulo="Señales fuera de servicio"
        detalle="Ver fallas"
        to="/gestion-fallas"
        tono="danger"
        valor={fueraServicio}
        cargando={cargandoFueraServicio}
      />
      <TarjetaAlerta
        titulo="Planes de mantenimiento vencidos"
        detalle="Ver plan de mantenimiento"
        to="/plan-mantenimiento"
        tono="danger"
        valor={planes.valor}
        cargando={planes.cargando}
      />
      <TarjetaAlerta
        titulo="Equipos con vida útil cumplida"
        detalle="Ver alertas de equipamiento"
        to="/equipamiento?tab=alertas"
        tono="warning"
        valor={equipos.valor}
        cargando={equipos.cargando}
      />
      <TarjetaAlerta
        titulo="Hechos pendientes"
        detalle="Ver hechos"
        to="/hechos"
        tono="warning"
        valor={hechos.valor}
        cargando={hechos.cargando}
      />
      <TarjetaAlerta
        titulo="Certificados por vencer o vencidos"
        detalle="Ver flota"
        to="/flota"
        tono="warning"
        valor={certificados.valor}
        cargando={certificados.cargando}
      />
      <TarjetaAlerta
        titulo="Préstamos vencidos"
        detalle="Ver documentación"
        to="/documentacion"
        tono="danger"
        valor={prestamos.valor}
        cargando={prestamos.cargando}
      />
    </div>
  );
}
