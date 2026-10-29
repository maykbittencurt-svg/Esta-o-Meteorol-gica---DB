import React, { useState } from 'react';
import { WeatherReading } from '../types/weather';
import { Search, FileSpreadsheet, FileJson, Sun, Gauge } from 'lucide-react';
import { evaluateUvIndex } from '../utils/calculations';

interface DataHistoryTableProps {
  readings: WeatherReading[];
  onExportCsv: () => void;
  onExportJson: () => void;
}

export const DataHistoryTable: React.FC<DataHistoryTableProps> = ({
  readings,
  onExportCsv,
  onExportJson,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const filtered = readings.filter((r) => {
    const term = searchTerm.toLowerCase();
    const dateStr = new Date(r.created_at).toLocaleString('pt-BR');
    const uvAssessment = evaluateUvIndex(r.uvIndex);
    return (
      dateStr.toLowerCase().includes(term) ||
      r.entry_id.toString().includes(term) ||
      r.temperature.toString().includes(term) ||
      r.humidity.toString().includes(term) ||
      r.pressure.toString().includes(term) ||
      r.uvIndex.toString().includes(term) ||
      uvAssessment.label.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered
    .slice()
    .reverse()
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#002855]">
              Histórico de Telemetria da Estação
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold border border-amber-200">
              BMP280 + S12ADE UV
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Total de {readings.length} amostras coletadas com medição barométrica e radiométrica
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por data, UVI, pressão..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#002855] w-48 sm:w-64"
            />
          </div>

          {/* Export Buttons */}
          <button
            onClick={onExportCsv}
            title="Exportar CSV com dados dos sensores BMP280 e S12ADE"
            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">CSV</span>
          </button>
          <button
            onClick={onExportJson}
            title="Exportar JSON bruto"
            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <FileJson className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">JSON</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50/80">
              <th className="py-3 px-3">ID</th>
              <th className="py-3 px-3">Data & Hora</th>
              <th className="py-3 px-3 text-right">Pressão BMP280</th>
              <th className="py-3 px-3 text-right">Radiação UV S12ADE</th>
              <th className="py-3 px-3 text-center">Risco OMS</th>
              <th className="py-3 px-3 text-right">Temperatura</th>
              <th className="py-3 px-3 text-right">Umidade</th>
              <th className="py-3 px-3 text-right">Sensação</th>
              <th className="py-3 px-3 text-right">Altitude Est.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {paginated.length > 0 ? (
              paginated.map((r) => {
                const uvAssess = evaluateUvIndex(r.uvIndex);
                return (
                  <tr key={r.entry_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-semibold text-slate-700">
                      #{r.entry_id}
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                      {new Date(r.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-[#002855] tabular-nums">
                      {r.pressure.toFixed(1)} hPa
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-amber-700 tabular-nums">
                      {r.uvIndex.toFixed(1)} UVI
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-[10px] font-bold"
                        style={{ backgroundColor: uvAssess.color, color: '#ffffff' }}
                      >
                        {uvAssess.label.split(' ')[0]}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-blue-700 tabular-nums">
                      {r.temperature.toFixed(1)} °C
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-[#00a896] tabular-nums">
                      {r.humidity.toFixed(1)} %
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600 tabular-nums">
                      {r.heatIndex?.toFixed(1) ?? '--'} °C
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-500 tabular-nums">
                      {r.altitude ? `${r.altitude} m` : '--'}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400">
                  Nenhum registro encontrado para a busca especificada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
        <div>
          Página <strong className="text-slate-800">{currentPage}</strong> de{' '}
          <strong className="text-slate-800">{totalPages}</strong>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors font-medium"
          >
            Anterior
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors font-medium"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
};
