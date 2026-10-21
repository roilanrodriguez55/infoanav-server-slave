import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Download,
  LayoutDashboard,
  Wrench,
  Loader2,
} from "lucide-react";
import {
  format,
  formatDistanceToNow,
  isToday,
  isTomorrow,
  parseISO,
  startOfDay,
  differenceInCalendarDays,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  dashboardService,
  type DashboardStats,
  type FaultAnalytics,
  type StatusByZone,
} from "@/services/dashboardService";
import { senalesService } from "@/services/api/senalesApi";
import { fallasService } from "@/services/api/fallasApi";
import { mantenimientosService } from "@/services/api/mantenApi";
import { TarjetasAlertas } from "@/pages/Dashboard/TarjetasAlerta";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";

type TabKey = "criticas" | "degradadas" | "offline";
type ModalKey = "reporte" | null;

type BadgeTone = "danger" | "warning" | "neutral" | "success";

interface SignalRowUi {
  id: string;
  name: string;
  type: string;
  badge: string;
  badgeTone: "danger" | "warning" | "neutral";
  meta: string;
  dot: "red" | "amber" | "gray";
}

interface MantRowUi {
  id: string;
  date: string;
  dateTone: "danger" | "warning" | "neutral";
  name: string;
  sub: string;
  badge: string;
  badgeTone: BadgeTone;
}

interface OpenFallaUi {
  id: string;
  severity: "Crítica" | "Moderada";
  title: string;
  desc: string;
}

interface TipoBar { label: string; pct: number; val: number; fill: string }

interface SenalApi {
  id_senal: string;
  nombre: string;
  id_tipo: string;
  id_zona: string;
  id_estado: string;
  created_at: string;
  updated_at?: string | null;
}

interface FallaApi {
  id_falla: string;
  id_senal: string;
  fecha_falla: string;
  fecha_restablecer: string | null;
  id_tipo_falla: string | null;
  causa_de_falla: string | null;
  observaciones: string | null;
}

interface MantApi {
  id_mantenimiento: string;
  id_senal: string;
  id_tipo_mant: string | null;
  fecha_inicio: string | null;
}

interface TipoFallaApi { id_tipo_falla: string; nombre: string }
interface TipoMantApi { id_tipo_mant: string; nombre: string }

function norm(s: string) {
  return s.trim().toLowerCase();
}

function classifySignalTab(estadoNombre: string): TabKey | null {
  const n = norm(estadoNombre);
  if (!n || n === "operativa") return null;
  if (
    n.includes("fuera de servicio") ||
    n.includes("pendiente de reparación") ||
    n.includes("pendiente de reparacion") ||
    n.includes("crític") ||
    n.includes("critico") ||
    n.includes("crítico")
  ) {
    return "criticas";
  }
  if (
    n.includes("sin señal") ||
    n.includes("sin senal") ||
    n.includes("offline") ||
    n.includes("sin comunicación") ||
    n.includes("sin comunicacion") ||
    n.includes("sin respuesta")
  ) {
    return "offline";
  }
  return "degradadas";
}

function tabToBadgeTone(tab: TabKey): SignalRowUi["badgeTone"] {
  if (tab === "criticas") return "danger";
  if (tab === "degradadas") return "warning";
  return "neutral";
}

function tabToDot(tab: TabKey): SignalRowUi["dot"] {
  if (tab === "criticas") return "red";
  if (tab === "degradadas") return "amber";
  return "gray";
}

function catalogMaps(
  estados: { id: string; nombre: string }[],
  zonas: { id: string; nombre: string }[],
  tipos: { id: string; nombre: string }[]
) {
  const estadoById = new Map(estados.map((e) => [e.id, e.nombre]));
  const zonaById = new Map(zonas.map((z) => [z.id, z.nombre]));
  const tipoById = new Map(tipos.map((t) => [t.id, t.nombre]));
  return { estadoById, zonaById, tipoById };
}

function buildSignalsByTab(
  senales: SenalApi[],
  estadoById: Map<string, string>,
  tipoById: Map<string, string>,
  zonaById: Map<string, string>
): Record<TabKey, SignalRowUi[]> {
  const out: Record<TabKey, SignalRowUi[]> = {
    criticas: [],
    degradadas: [],
    offline: [],
  };
  for (const s of senales) {
    const estado = estadoById.get(s.id_estado) ?? "";
    const tab = classifySignalTab(estado);
    if (!tab) continue;
    const tipo = tipoById.get(s.id_tipo) ?? "Señal";
    const zona = zonaById.get(s.id_zona) ?? "";
    const typeLine = zona ? `${tipo} · ${zona}` : tipo;
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- se mantiene || para tratar "" como vacio
    const ref = (s.updated_at && String(s.updated_at)) || s.created_at;
    let meta = "—";
    try {
      if (ref) meta = formatDistanceToNow(parseISO(ref), { addSuffix: true, locale: es });
    } catch {
      meta = "—";
    }
    out[tab].push({
      id: s.id_senal,
      name: s.nombre,
      type: typeLine,
      badge: estado || "Sin estado",
      badgeTone: tabToBadgeTone(tab),
      meta,
      dot: tabToDot(tab),
    });
  }
  return out;
}

function labelMantDate(iso: string): { text: string; tone: "danger" | "warning" | "neutral" } {
  const d = parseISO(iso);
  if (isToday(d)) return { text: "Hoy", tone: "danger" };
  if (isTomorrow(d)) return { text: "Mañana", tone: "warning" };
  return { text: format(d, "d MMM", { locale: es }), tone: "neutral" };
}

function mantBadgeFromDays(days: number): { text: string; tone: BadgeTone } {
  if (days <= 0) return { text: "Vence hoy", tone: "danger" };
  if (days === 1) return { text: "1 día", tone: "warning" };
  if (days <= 7) return { text: `${days} días`, tone: "warning" };
  return { text: `${days} días`, tone: "neutral" };
}

function buildMantRows(
  mantenimientos: MantApi[],
  tipos: TipoMantApi[],
  senalById: Map<string, string>,
  horizonDays = 7,
  limit = 8
): MantRowUi[] {
  const tipoById = new Map(tipos.map((t) => [t.id_tipo_mant, t.nombre]));
  const today = startOfDay(new Date());
  const horizon = startOfDay(new Date(today.getTime() + horizonDays * 86400000));
  const rows: MantRowUi[] = [];
  const sorted = [...mantenimientos].filter((m) => m.fecha_inicio).sort((a, b) => {
    const ta = parseISO(a.fecha_inicio!).getTime();
    const tb = parseISO(b.fecha_inicio!).getTime();
    return ta - tb;
  });
  for (const m of sorted) {
    if (rows.length >= limit) break;
    const start = startOfDay(parseISO(m.fecha_inicio!));
    if (start < today || start > horizon) continue;
    const days = differenceInCalendarDays(start, today);
    const { text, tone } = labelMantDate(m.fecha_inicio!);
    const badge = mantBadgeFromDays(days);
    const nombreSenal = senalById.get(m.id_senal) ?? "Señal";
    const tipoNombre = m.id_tipo_mant ? tipoById.get(m.id_tipo_mant) ?? "Mantenimiento" : "Mantenimiento";
    rows.push({
      id: m.id_mantenimiento,
      date: text,
      dateTone: tone,
      name: nombreSenal,
      sub: tipoNombre,
      badge: badge.text,
      badgeTone: badge.tone,
    });
  }
  return rows;
}

function fallaSeverityFromTipo(tipoNombre: string): "Crítica" | "Moderada" {
  const n = norm(tipoNombre);
  if (n.includes("crít") || n.includes("crit")) return "Crítica";
  return "Moderada";
}

function buildOpenFallas(
  fallas: FallaApi[],
  tipos: TipoFallaApi[],
  senalById: Map<string, string>,
  limit = 6
): OpenFallaUi[] {
  const tipoById = new Map(tipos.map((t) => [t.id_tipo_falla, t.nombre]));
  const abiertas = fallas
    .filter((f) => !f.fecha_restablecer)
    .sort((a, b) => parseISO(b.fecha_falla).getTime() - parseISO(a.fecha_falla).getTime())
    .slice(0, limit);
  return abiertas.map((f) => {
    const tipoNombre = f.id_tipo_falla ? tipoById.get(f.id_tipo_falla) ?? "Falla" : "Falla";
    const title = senalById.get(f.id_senal) ?? "Señal";
    const desc =
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- se mantiene || para tratar "" como vacio
      f.causa_de_falla?.trim() ||
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- se mantiene || para tratar "" como vacio
      f.observaciones?.trim() ||
      "Sin descripción";
    return {
      id: f.id_falla,
      severity: fallaSeverityFromTipo(tipoNombre),
      title,
      desc,
    };
  });
}

function monthOf(iso: string) {
  const d = parseISO(iso);
  return { m: d.getMonth() + 1, y: d.getFullYear() };
}

function buildTipoBars(
  fallas: FallaApi[],
  tipos: TipoFallaApi[],
  now: Date
): TipoBar[] {
  const tipoById = new Map(tipos.map((t) => [t.id_tipo_falla, t.nombre]));
  const my = { m: now.getMonth() + 1, y: now.getFullYear() };
  const counts = new Map<string, number>();
  for (const f of fallas) {
    if (f.fecha_restablecer) continue;
    const fm = monthOf(f.fecha_falla);
    if (fm.m !== my.m || fm.y !== my.y) continue;
    const key = f.id_tipo_falla ?? "__none__";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const entries = [...counts.entries()]
    .map(([id, val]) => ({
      label: id === "__none__" ? "Sin tipo" : tipoById.get(id) ?? "Tipo",
      val,
    }))
    .sort((a, b) => b.val - a.val)
    .slice(0, 3);
  const max = Math.max(...entries.map((e) => e.val), 1);
  const fills = ["bg-red-500", "bg-amber-500", "bg-sky-600"];
  return entries.map((e, i) => ({
    label: e.label,
    val: e.val,
    pct: Math.round((100 * e.val) / max),
    fill: fills[i % fills.length],
  }));
}

function resolucionBucket(tipoNombre: string): "Críticas" | "Moderadas" | "Leves" {
  const n = norm(tipoNombre);
  if (n.includes("crít") || n.includes("crit")) return "Críticas";
  if (n.includes("moder")) return "Moderadas";
  return "Leves";
}

function buildResolucionBars(
  fallas: FallaApi[],
  tipos: TipoFallaApi[],
  now: Date
): { label: string; pct: number; val: string; fill: string }[] {
  const tipoById = new Map(tipos.map((t) => [t.id_tipo_falla, t.nombre]));
  const my = { m: now.getMonth() + 1, y: now.getFullYear() };
  const buckets: Record<"Críticas" | "Moderadas" | "Leves", number> = {
    Críticas: 0,
    Moderadas: 0,
    Leves: 0,
  };
  for (const f of fallas) {
    if (!f.fecha_restablecer) continue;
    const fm = monthOf(f.fecha_falla);
    if (fm.m !== my.m || fm.y !== my.y) continue;
    const tn = f.id_tipo_falla ? tipoById.get(f.id_tipo_falla) ?? "" : "";
    buckets[resolucionBucket(tn)] += 1;
  }
  const order: (keyof typeof buckets)[] = ["Críticas", "Moderadas", "Leves"];
  const max = Math.max(...order.map((k) => buckets[k]), 1);
  const fills: Record<string, string> = {
    Críticas: "bg-red-500",
    Moderadas: "bg-amber-500",
    Leves: "bg-emerald-600",
  };
  return order.map((label) => ({
    label,
    val: String(buckets[label]),
    pct: Math.round((100 * buckets[label]) / max),
    fill: fills[label],
  }));
}

const tabLabelsBase: { key: TabKey; label: string }[] = [
  { key: "criticas", label: "Críticas" },
  { key: "degradadas", label: "Degradadas" },
  { key: "offline", label: "Sin señal" },
];

function badgeToneClass(tone: "danger" | "warning" | "neutral" | "success") {
  switch (tone) {
    case "danger":
      return "bg-red-500/15 text-red-600 dark:text-red-400";
    case "warning":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
    case "success":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
    default:
      return "bg-gray-100 text-gray-600 dark:bg-gray-700/60 dark:text-gray-300";
  }
}

function dotClass(dot: "red" | "amber" | "gray") {
  if (dot === "red") return "bg-red-500";
  if (dot === "amber") return "bg-amber-500";
  return "bg-gray-400";
}


function dateToneClass(tone: "danger" | "warning" | "neutral") {
  if (tone === "danger") return "text-red-600 dark:text-red-400";
  if (tone === "warning") return "text-amber-600 dark:text-amber-400";
  return "text-gray-900 dark:text-gray-100";
}

const Dashboard = () => {
  const [tab, setTab] = useState<TabKey>("criticas");
  const [modal, setModal] = useState<ModalKey>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<FaultAnalytics[]>([]);
  const [, setZones] = useState<StatusByZone[]>([]);
  const [signalsByTab, setSignalsByTab] = useState<Record<TabKey, SignalRowUi[]>>({
    criticas: [],
    degradadas: [],
    offline: [],
  });
  const [mantRows, setMantRows] = useState<MantRowUi[]>([]);
  const [openFallasList, setOpenFallasList] = useState<OpenFallaUi[]>([]);
  const [tipoBars, setTipoBars] = useState<TipoBar[]>([]);
  const [resolucionBars, setResolucionBars] = useState<
    { label: string; pct: number; val: string; fill: string }[]
  >([]);
  const [mttrCompare, setMttrCompare] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const now = new Date();
    const settled = await Promise.allSettled([
      dashboardService.getDashboardStats(),
      dashboardService.getFaultAnalytics(now.getMonth() + 1, now.getFullYear()),
      dashboardService.getStatusByZone(),
      senalesService.getCatalogos(),
      senalesService.getSenales(),
      fallasService.getAll(),
      fallasService.getTiposFalla(),
      mantenimientosService.getAll(),
      mantenimientosService.getTiposMantenimiento(),
    ]);

    const rpcRejected = [0, 1, 2].filter((i) => settled[i].status === "rejected");
    if (rpcRejected.length === 3) {
      setError("Error al cargar los datos del dashboard");
      setLoading(false);
      return;
    }
    if (rpcRejected.length > 0) {
      setError("Algunas métricas no pudieron cargarse; el resto se muestra con datos disponibles.");
    } else {
      setError(null);
    }

    if (settled[0].status === "fulfilled") setStats(settled[0].value);
    if (settled[1].status === "fulfilled") {
      const analyticsData = settled[1].value;
      setAnalytics(analyticsData);
      if (analyticsData.length >= 2) {
        const a = analyticsData[0]?.tiempo_medio_resolucion;
        const b = analyticsData[analyticsData.length - 1]?.tiempo_medio_resolucion;
        setMttrCompare(a && b && a !== b ? `${a} → ${b}` : null);
      } else {
        setMttrCompare(null);
      }
    }
    if (settled[2].status === "fulfilled") setZones(settled[2].value);

    if (settled[4].status === "fulfilled") {
      const senRes = settled[4].value;
      const cat =
        settled[3].status === "fulfilled"
          ? settled[3].value
          : { estados: [] as { id: string; nombre: string }[], zonas: [] as { id: string; nombre: string }[], tipos: [] as { id: string; nombre: string }[] };
      if (senRes.success && Array.isArray(senRes.data)) {
        const { estadoById, zonaById, tipoById } = catalogMaps(cat.estados, cat.zonas, cat.tipos);
        setSignalsByTab(
          buildSignalsByTab(senRes.data as SenalApi[], estadoById, tipoById, zonaById)
        );
      } else {
        setSignalsByTab({ criticas: [], degradadas: [], offline: [] });
      }
    } else {
      setSignalsByTab({ criticas: [], degradadas: [], offline: [] });
    }

    if (settled[4].status === "fulfilled" && settled[7].status === "fulfilled" && settled[8].status === "fulfilled") {
      const senRes = settled[4].value;
      const mantRes = settled[7].value;
      const tiposMantRes = settled[8].value;
      if (senRes.success && mantRes.success && Array.isArray(senRes.data) && Array.isArray(mantRes.data)) {
        const senalById = new Map((senRes.data as SenalApi[]).map((s) => [s.id_senal, s.nombre]));
        const tiposMant = tiposMantRes.success && Array.isArray(tiposMantRes.data) ? (tiposMantRes.data as TipoMantApi[]) : [];
        setMantRows(buildMantRows(mantRes.data as MantApi[], tiposMant, senalById));
      } else {
        setMantRows([]);
      }
    } else {
      setMantRows([]);
    }

    if (settled[4].status === "fulfilled" && settled[5].status === "fulfilled" && settled[6].status === "fulfilled") {
      const senRes = settled[4].value;
      const fallRes = settled[5].value;
      const tiposFallaRes = settled[6].value;
      if (senRes.success && fallRes.success && Array.isArray(senRes.data) && Array.isArray(fallRes.data)) {
        const senalById = new Map((senRes.data as SenalApi[]).map((s) => [s.id_senal, s.nombre]));
        const tiposFalla = tiposFallaRes.success && Array.isArray(tiposFallaRes.data) ? (tiposFallaRes.data as TipoFallaApi[]) : [];
        const fallas = fallRes.data as FallaApi[];
        setOpenFallasList(buildOpenFallas(fallas, tiposFalla, senalById));
        setTipoBars(buildTipoBars(fallas, tiposFalla, now));
        setResolucionBars(buildResolucionBars(fallas, tiposFalla, now));
      } else {
        setOpenFallasList([]);
        setTipoBars([]);
        setResolucionBars([]);
      }
    } else {
      setOpenFallasList([]);
      setTipoBars([]);
      setResolucionBars([]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial de datos
    void fetchData();
  }, [fetchData]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2500);
    return () => window.clearTimeout(t);
  }, [toast]);

  const chartData = useMemo(() => {
    return analytics.map((item) => ({
      label: item.semana,
      value: item.total_fallas,
      color: item.total_fallas > 7 ? "bg-red-500" : item.total_fallas > 4 ? "bg-amber-500" : "bg-emerald-600",
    }));
  }, [analytics]);

  const maxSemana = useMemo(
    () => Math.max(...chartData.map((s) => s.value), 1),
    [chartData]
  );

  const tabLabels = useMemo(
    () =>
      tabLabelsBase.map(({ key, label }) => ({
        key,
        label: `${label} (${signalsByTab[key].length})`,
      })),
    [signalsByTab]
  );

  const closeModal = () => setModal(null);

  return (
    <div className="w-full min-w-0 space-y-6">
      <h2 className="sr-only">
        Dashboard de gestión de señales marítimas — estado operacional, fallas y
        mantenimientos activos
      </h2>

      <PageHeader
        icon={<LayoutDashboard />}
        title="Panel operacional"
        subtitle="Señales marítimas · Actualizado ahora"
        actions={
          <>
            <span className="inline-flex items-center gap-2 self-center text-sm text-gray-600 dark:text-gray-400">
              <span
                className="h-2 w-2 shrink-0 rounded-full bg-emerald-500 animate-pulse"
                aria-hidden
              />
              En vivo
            </span>
            <Button variant="neutral" onClick={() => setModal("reporte")}>
              <Download className="h-4 w-4 mr-2 text-icon" aria-hidden />
              Exportar reporte
            </Button>
          </>
        }
      />

      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Situación ahora mismo
        </p>
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 relative">
              {loading && <Loader2 className="absolute top-2 right-2 h-4 w-4 animate-spin text-icon" />}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Señales totales
              </p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                {loading ? "..." : stats?.senales_total ?? 0}
              </p>
              {/* <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                {loading ? "Cargando..." : `${stats?.senales_operativas ?? 0} operativas`}
              </p> */}
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 relative">
              {loading && <Loader2 className="absolute top-2 right-2 h-4 w-4 animate-spin text-icon" />}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Fuera de servicio
              </p>
              <p className="mt-1 text-2xl font-semibold text-red-600 dark:text-red-400">
                {loading ? "..." : stats?.fuera_servicio ?? 0}
              </p>
              <p className="mt-1 text-xs text-red-600/90 dark:text-red-400/90">
                {loading ? "Cargando..." : stats?.fuera_servicio ? "Requieren atención inmediata" : "Sin señales fuera de servicio"}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 relative">
              {loading && <Loader2 className="absolute top-2 right-2 h-4 w-4 animate-spin text-icon" />}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Fallas abiertas
              </p>
              <p className="mt-1 text-2xl font-semibold text-amber-600 dark:text-amber-400">
                {loading ? "..." : stats?.fallas_abiertas ?? 0}
              </p>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-400/90">
                {loading ? "Cargando..." : stats?.fallas_abiertas ? "Pendientes de resolución" : "No hay fallas abiertas"}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 relative">
              {loading && <Loader2 className="absolute top-2 right-2 h-4 w-4 animate-spin text-icon" />}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Mantenimientos próx. 7 días
              </p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                {loading ? "..." : stats?.mant_proximos ?? 0}
              </p>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-400/90">
                {loading ? "Cargando..." : stats?.mant_proximos ? "Programados próximamente" : "Sin mantenimientos próximos"}
              </p>
            </div>
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Alertas
        </p>
        <TarjetasAlertas
          fueraServicio={stats?.fuera_servicio ?? null}
          cargandoFueraServicio={loading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
              <AlertTriangle
                className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400"
                aria-hidden
              />
              Señales que requieren acción
            </span>
            <Link
              to="/gestion-senales"
              className="self-start rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-white/5 sm:self-auto"
            >
              Ver todas ↗
            </Link>
          </div>

          <div className="mb-4 flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-700">
            {tabLabels.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`border-b-2 px-3 py-2 text-sm ${
                  tab === key
                    ? "border-gray-900 font-medium text-gray-900 dark:border-white dark:text-white"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {signalsByTab[tab].length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              {loading ? "Cargando…" : "No hay señales en esta categoría"}
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700/80">
              {signalsByTab[tab].map((row) => (
                <li
                  key={row.id}
                  className="flex flex-col gap-2 py-3 first:pt-0 sm:flex-row sm:items-center sm:gap-3 sm:py-2.5"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${dotClass(row.dot)}`}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                        {row.name}
                      </p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {row.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-3 sm:shrink-0">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${badgeToneClass(row.badgeTone)}`}
                    >
                      {row.badge}
                    </span>
                    <span className="text-xs whitespace-nowrap text-gray-500 dark:text-gray-400">
                      {row.meta}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-1 flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-5">
            <div className="mb-3">
              <span className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                <Wrench className="h-4 w-4 shrink-0 text-icon" aria-hidden />
                Mantenimientos próximos
              </span>
            </div>
            <ul className="divide-y divide-gray-100 dark:divide-gray-700/80">
              {mantRows.length === 0 ? (
                <li className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  {loading ? "Cargando…" : "No hay mantenimientos programados en los próximos 7 días"}
                </li>
              ) : (
                mantRows.map((m) => (
                  <li
                    key={m.id}
                    className="flex flex-col gap-2 py-3 first:pt-0 sm:flex-row sm:items-center sm:gap-3 sm:py-2.5"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`w-16 shrink-0 text-xs font-medium ${dateToneClass(m.dateTone)}`}
                      >
                        {m.date}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {m.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {m.sub}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-end">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${badgeToneClass(m.badgeTone)}`}
                      >
                        {m.badge}
                      </span>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-5 relative">
          {loading && <Loader2 className="absolute top-4 right-4 h-4 w-4 animate-spin text-icon" />}
          <div className="mb-4">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Fallas este mes
            </span>
          </div>
          <div
            className="flex h-36 items-end justify-between gap-2 px-1"
            role="img"
            aria-label="Fallas por semana este mes"
          >
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-2 animate-pulse">
                  <div className="h-28 w-full max-w-14 bg-gray-100 dark:bg-white/10 rounded-md" />
                  <div className="h-2 w-8 bg-gray-100 dark:bg-white/10 rounded" />
                </div>
              ))
            ) : chartData.length > 0 ? (
              chartData.map((s) => (
                <div
                  key={s.label}
                  className="flex flex-1 flex-col items-center gap-2"
                >
                  <div className="flex h-28 w-full max-w-14 items-end justify-center rounded-md bg-gray-100 dark:bg-white/10">
                    <div
                      className={`w-full rounded-t ${s.color}`}
                      style={{
                        height: `${Math.round((s.value / maxSemana) * 100)}%`,
                        minHeight: "12%",
                      }}
                    />
                  </div>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    {s.label}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 w-full text-center py-10">No hay datos de fallas</p>
            )}
          </div>
          <hr className="my-4 border-gray-100 dark:border-gray-700" />
          <div className="space-y-2">
            {tipoBars.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">Sin fallas abiertas este mes por tipo</p>
            ) : (
              tipoBars.map((b, idx) => (
                <div key={`${b.label}-${idx}`} className="flex items-center gap-2">
                  <span className="w-24 shrink-0 truncate text-xs text-gray-600 dark:text-gray-400">
                    {b.label}
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                    <div
                      className={`h-full rounded-full ${b.fill}`}
                      style={{ width: `${b.pct}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-xs font-medium text-gray-900 dark:text-white">
                    {b.val}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-5 relative">
          {loading && <Loader2 className="absolute top-4 right-4 h-4 w-4 animate-spin text-icon" />}
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Tiempo medio resolución
            </span>
            {mttrCompare ? (
              <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:text-amber-300">
                {mttrCompare}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
            {loading ? "..." : (analytics[analytics.length - 1]?.tiempo_medio_resolucion ?? "0 h")}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Promedio última semana · {new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
          </p>
          <div className="mt-4 space-y-2">
            {resolucionBars.map((b) => (
              <div key={b.label} className="flex items-center gap-2">
                <span className="w-24 shrink-0 text-xs text-gray-600 dark:text-gray-400">
                  {b.label}
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                  <div
                    className={`h-full rounded-full ${b.fill}`}
                    style={{ width: `${b.pct}%` }}
                  />
                </div>
                <span className="w-9 text-right text-xs font-medium text-gray-900 dark:text-white">
                  {b.val}
                </span>
              </div>
            ))}
          </div>
          <hr className="my-4 border-gray-100 dark:border-gray-700" />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {stats?.fallas_abiertas ?? 0} fallas abiertas requieren seguimiento —{" "}
            <span className="font-medium text-red-600 dark:text-red-400">
              acción requerida
            </span>
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-5">
          <div className="mb-4">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Fallas abiertas
            </span>
          </div>
          <ul className="divide-y divide-gray-100 dark:divide-gray-700/80">
            {openFallasList.length === 0 ? (
              <li className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                {loading ? "Cargando…" : "No hay fallas abiertas"}
              </li>
            ) : (
              openFallasList.map((f) => (
                <li key={f.id} className="py-4 first:pt-0">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                          f.severity === "Crítica"
                            ? badgeToneClass("danger")
                            : badgeToneClass("warning")
                        }`}
                      >
                        {f.severity}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {f.title}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {f.desc}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => showToast("Técnico asignado")}
                        className="rounded-lg border border-sky-500/40 px-2.5 py-1 text-xs font-medium text-sky-700 dark:text-sky-300"
                      >
                        Asignar
                      </button>
                      <button
                        type="button"
                        onClick={() => showToast("Falla cerrada")}
                        className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-white/5"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {modal === "reporte" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-reporte-title"
        >
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-popover p-5 shadow-theme-lg dark:border-gray-700">
            <div className="mb-4 flex items-center justify-between">
              <h2
                id="modal-reporte-title"
                className="text-base font-medium text-gray-900 dark:text-white"
              >
                Exportar reporte
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            <label className="mb-3 block text-xs text-gray-500 dark:text-gray-400">
              Periodo
              <select className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                <option>Hoy</option>
                <option>Últimos 7 días</option>
                <option>Este mes</option>
              </select>
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 dark:border-gray-600 dark:text-gray-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  closeModal();
                  showToast("Reporte generado — descargando…");
                }}
                className="rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700"
              >
                Generar reporte
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className="fixed bottom-4 right-4 z-60 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-800 shadow-lg dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          role="status"
        >
          ✓ {toast}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
