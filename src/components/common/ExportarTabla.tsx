import { useState } from 'react';
import { FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type CeldaExport = string | number | boolean | null | undefined;

export interface ColumnaExport {
  clave: string;
  titulo: string;
}

interface ExportarTablaProps {
  titulo: string;
  columnas: ColumnaExport[];
  filas: Record<string, CeldaExport>[];
  nombreArchivo: string;
}

const MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// Excel no admite los caracteres : \ / ? * [ ] en el nombre de hoja ni mas de 31 caracteres.
const nombreHoja = (titulo: string): string => titulo.replace(/[:\\/?*[\]]/g, ' ').slice(0, 31);

const valorExcel = (valor: CeldaExport): string | number | undefined => {
  if (valor === null || valor === undefined) return undefined;
  if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
  return valor;
};

const valorPdf = (valor: CeldaExport): string => {
  if (valor === null || valor === undefined) return '';
  if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
  return String(valor);
};

function descargar(blob: Blob, nombre: string): void {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function ExportarTabla({ titulo, columnas, filas, nombreArchivo }: ExportarTablaProps) {
  const [exportando, setExportando] = useState<'excel' | 'pdf' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sinFilas = filas.length === 0;

  // Las librerias se cargan al exportar para no sumarlas al bundle inicial.
  const exportarExcel = async () => {
    const ExcelJS = await import('exceljs');
    const libro = new ExcelJS.Workbook();
    const hoja = libro.addWorksheet(nombreHoja(titulo));
    hoja.columns = columnas.map((columna) => ({ header: columna.titulo, key: columna.clave, width: 20 }));
    hoja.getRow(1).font = { bold: true };
    hoja.addRows(
      filas.map((fila) => Object.fromEntries(columnas.map((columna) => [columna.clave, valorExcel(fila[columna.clave])]))),
    );
    const buffer = await libro.xlsx.writeBuffer();
    descargar(new Blob([buffer], { type: MIME_XLSX }), `${nombreArchivo}.xlsx`);
  };

  const exportarPdf = async () => {
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
    const documento = new jsPDF({ orientation: columnas.length > 6 ? 'landscape' : 'portrait' });
    documento.setFontSize(14);
    documento.text(titulo, 14, 16);
    autoTable(documento, {
      startY: 22,
      head: [columnas.map((columna) => columna.titulo)],
      body: filas.map((fila) => columnas.map((columna) => valorPdf(fila[columna.clave]))),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [55, 65, 81] },
    });
    documento.save(`${nombreArchivo}.pdf`);
  };

  const ejecutar = async (formato: 'excel' | 'pdf') => {
    setExportando(formato);
    setError(null);
    try {
      if (formato === 'excel') await exportarExcel();
      else await exportarPdf();
    } catch (err) {
      console.error('Error exportando tabla:', err);
      setError('No se pudo generar el archivo');
    } finally {
      setExportando(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" disabled={sinFilas || exportando !== null} onClick={() => void ejecutar('excel')}>
        <FileSpreadsheet className="mr-1 h-4 w-4" />
        {exportando === 'excel' ? 'Generando...' : 'Exportar Excel'}
      </Button>
      <Button variant="outline" size="sm" disabled={sinFilas || exportando !== null} onClick={() => void ejecutar('pdf')}>
        <FileText className="mr-1 h-4 w-4" />
        {exportando === 'pdf' ? 'Generando...' : 'Exportar PDF'}
      </Button>
      {error && <span className="text-sm text-red-600 dark:text-red-400">{error}</span>}
    </div>
  );
}
