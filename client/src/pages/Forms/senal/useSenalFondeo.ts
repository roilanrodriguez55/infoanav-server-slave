import { useCallback, useState } from 'react';
import type { BridaItem, CadenaItem, FondeoControl, GrectoItem, PesoMuertoItem, SistemaFondeo } from './tipos';

export const useSenalFondeo = (): FondeoControl => {
  const [noSerieFlotador, setNoSerieFlotador] = useState('');
  const [cadenas, setCadenas] = useState<CadenaItem[]>([{ diametro: '', cantidad: 1 }]);
  const [pesosMuertos, setPesosMuertos] = useState<PesoMuertoItem[]>([{ peso: '', cantidad: 1 }]);
  const [bridas, setBridas] = useState<BridaItem[]>([{ tipo: '', cantidad: 1 }]);
  const [grectos, setGrectos] = useState<GrectoItem[]>([{ tipo: '', cantidad: 1, giratorio: false }]);

  // Funciones para arrays de fondeo
  const agregarCadena = () => {
    setCadenas([...cadenas, { diametro: '', cantidad: 1 }]);
  };

  const eliminarCadena = (index: number) => {
    setCadenas(cadenas.filter((_, i) => i !== index));
  };

  const actualizarCadena = (index: number, campo: string, valor: string | number) => {
    const nuevasCadenas = [...cadenas];
    nuevasCadenas[index] = { ...nuevasCadenas[index], [campo]: valor };
    setCadenas(nuevasCadenas);
  };

  const agregarPesoMuerto = () => {
    setPesosMuertos([...pesosMuertos, { peso: '', cantidad: 1 }]);
  };

  const eliminarPesoMuerto = (index: number) => {
    setPesosMuertos(pesosMuertos.filter((_, i) => i !== index));
  };

  const actualizarPesoMuerto = (index: number, campo: string, valor: string | number) => {
    const nuevosPesos = [...pesosMuertos];
    nuevosPesos[index] = { ...nuevosPesos[index], [campo]: valor };
    setPesosMuertos(nuevosPesos);
  };

  const agregarBrida = () => {
    setBridas([...bridas, { tipo: '', cantidad: 1 }]);
  };

  const eliminarBrida = (index: number) => {
    setBridas(bridas.filter((_, i) => i !== index));
  };

  const actualizarBrida = (index: number, campo: string, valor: string | number) => {
    const nuevasBridas = [...bridas];
    nuevasBridas[index] = { ...nuevasBridas[index], [campo]: valor };
    setBridas(nuevasBridas);
  };

  const agregarGrecto = () => {
    setGrectos([...grectos, { tipo: '', cantidad: 1, giratorio: false }]);
  };

  const eliminarGrecto = (index: number) => {
    setGrectos(grectos.filter((_, i) => i !== index));
  };

  const actualizarGrecto = (index: number, campo: string, valor: string | number | boolean) => {
    const nuevosGrectos = [...grectos];
    nuevosGrectos[index] = { ...nuevosGrectos[index], [campo]: valor };
    setGrectos(nuevosGrectos);
  };

  const cargar = useCallback((fondeo: SistemaFondeo) => {
    setNoSerieFlotador(fondeo.no_serie_flotador ?? '');
    setCadenas(fondeo.cadenas ?? [{ diametro: '', cantidad: 1 }]);
    setPesosMuertos(fondeo.pesos_muertos ?? [{ peso: '', cantidad: 1 }]);
    setBridas(fondeo.bridas ?? [{ tipo: '', cantidad: 1 }]);
    setGrectos(fondeo.grectos ?? [{ tipo: '', cantidad: 1, giratorio: false }]);
  }, []);

  const reiniciar = () => {
    setNoSerieFlotador('');
    setCadenas([{ diametro: '', cantidad: 1 }]);
    setPesosMuertos([{ peso: '', cantidad: 1 }]);
    setBridas([{ tipo: '', cantidad: 1 }]);
    setGrectos([{ tipo: '', cantidad: 1, giratorio: false }]);
  };

  return {
    noSerieFlotador,
    setNoSerieFlotador,
    cadenas,
    agregarCadena,
    eliminarCadena,
    actualizarCadena,
    pesosMuertos,
    agregarPesoMuerto,
    eliminarPesoMuerto,
    actualizarPesoMuerto,
    bridas,
    agregarBrida,
    eliminarBrida,
    actualizarBrida,
    grectos,
    agregarGrecto,
    eliminarGrecto,
    actualizarGrecto,
    cargar,
    reiniciar
  };
};
