import PageMeta from "../../components/common/PageMeta";
import Dashboard from "./Dashboard";

export default function Placeholder() {
  return (
    <div>
      <PageMeta
        title="INFOANAV - Sistema de Gestión Marítima"
        description="Sistema de Gestión, Registro e Información de la Señalización Marítima"
      />
      <Dashboard />
    </div>
  );
}
