import { useCallback, useEffect, useState } from 'react';
import { authService } from '@/services/api/authApi';
import type { EstadoSetup } from '@/types/auth.types';

// Si el servidor no responde se asume que no hace falta el alta inicial: la app sigue su flujo normal.
const SIN_SETUP: EstadoSetup = { necesitaAdministrador: false, empresas: [] };

export function useSetupStatus() {
  const [estado, setEstado] = useState<EstadoSetup | null>(null);

  const recargar = useCallback((): Promise<void> =>
    authService
      .setupStatus()
      .then((datos) => setEstado(datos))
      .catch(() => setEstado(SIN_SETUP)), []);

  const marcarConfigurado = useCallback((): void => {
    setEstado((previo) => (previo === null ? previo : { ...previo, necesitaAdministrador: false, empresas: [] }));
  }, []);

  useEffect(() => {
    let activo = true;
    authService
      .setupStatus()
      .then((datos) => {
        if (activo) setEstado(datos);
      })
      .catch(() => {
        if (activo) setEstado(SIN_SETUP);
      });
    return () => {
      activo = false;
    };
  }, []);

  return { estado, recargar, marcarConfigurado };
}
