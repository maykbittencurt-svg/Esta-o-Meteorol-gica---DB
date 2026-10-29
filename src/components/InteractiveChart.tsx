import React, { useState, useMemo, useRef } from 'react';
import { WeatherReading, TimeRange } from '../types/weather';
import { Thermometer, Droplets, Gauge, Sun, Download } from 'lucide-react';
import { evaluateUvIndex } from '../utils/calculations';

interface InteractiveChartProps {
  readings: WeatherReading[];
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  onExportCsv?: () => void;
}

type ActiveMetric = 'temperature' | 'humidity' | 'pressure' | 'uv';

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  readings,
  timeRange,
  setTimeRange,
  onExportCsv,
}) => {
  const [activeMetric, setActiveMetric] = useState<ActiveMetric>('uv');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredReadings = useMemo(() => {
    if (readings.length === 0) return [];
    if (timeRange === '7d') return readings;
    const countMap: Record<TimeRange, number> = {
      '1h': 20,
      '6h': 40,
      '24h': 60,
      '7d': readings.length,
    };
    const maxItems = countMap[timeRange] || readings.length;
    return readings.slice(-maxItems);
  }, [readings, timeRange]);

  const metricConfigs = {
    temperature: {
      label: 'Temperatura',
      sensor: 'DHT22 / BMP280',
      unit: '°C',
      color: '#1d4ed8', // Azul
      gradientId: 'tempGrad',
      icon: Thermometer,
      getter: (r: WeatherReading) => r.temperature,
      formatter: (v: number) => `${v.toFixed(1)} °C`,
      decimals: 1,
    },
    humidity: {
      label: 'Umidade Relativa',
      sensor: 'DHT22 Capacitivo',
      unit: '%',
      color: '#00a896', // Verde-água
      gradientId: 'humGrad',
      icon: Droplets,
      getter: (r: WeatherReading) => r.humidity,
      formatter: (v: number) => `${v.toFixed(1)} %`,
      decimals: 1,
    },
    pressure: {
      label: 'Pressão Atmosférica',
      sensor: 'BMP280 (Bosch I2C)',
      unit: 'hPa',
      color: '#002855', // Dom Bosco Navy
      gradientId: 'pressGrad',
      icon: Gauge,
      getter: (r: WeatherReading) => r.pressure,
      formatter: (v: number) => `${v.toFixed(1)} hPa`,
      decimals: 1,
    },
    uv: {
      label: 'Radiação Ultravioleta',
      sensor: 'S12ADE / GUVA-S12SD',
      unit: 'UVI',
      color: '#f59e0b', // Âmbar solar
      gradientId: 'uvGrad',
      icon: Sun,
      getter: (r: WeatherReading) => r.uvIndex,
      formatter: (v: number) => {
        const assess = evaluateUvIndex(v);
        return `${v.toFixed(1)} UVI (${assess.label})`;
      },
      decimals: 1,
    },
  };

  const svgWidth = 860;
  const svgHeight = 280;
  const padding = { top: 24, right: 30, bottom: 36, left: 56 };
  const graphWidth = svgWidth - padding.left - padding.right;
  const graphHeight = svgHeight - padding.top - padding.bottom;

  const chartData = useMemo(() => {
    if (filteredReadings.length === 0) return null;
    const config = metricConfigs[activeMetric];
    const values = filteredReadings.map(config.getter);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    // Breathing room
    const yMin = Math.max(0, minVal - range * 0.12);
    const yMax = maxVal + range * 0.12;
    const yRange = yMax - yMin || 1;

    const points = filteredReadings.map((reading, i) => {
      const x = padding.left + (i / (filteredReadings.length - 1 || 1)) * graphWidth;
      const val = config.getter(reading);
      const y = padding.top + graphHeight - ((val - yMin) / yRange) * graphHeight;
      return { x, y, value: val, reading, index: i };
    });

    let pathD = '';
    let areaD = '';
    if (points.length > 0) {
      pathD = `M ${points[0].x} ${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const cpX = (p0.x + p1.x) / 2;
        pathD += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
      }
      areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + graphHeight} L ${points[0].x} ${padding.top + graphHeight} Z`;
    }

    const yTicks = [0, 0.33, 0.66, 1].map((pct) => {
      const val = yMin + pct * yRange;
      const y = padding.top + graphHeight - pct * graphHeight;
      return { val, y };
    });

    const sum = values.reduce((acc, v) => acc + v, 0);
    const avg = sum / values.length;

    return {
      points,
      pathD,
      areaD,
      yTicks,
      minVal,
      maxVal,
      avg,
      config,
    };
  }, [filteredReadings, activeMetric, graphWidth, graphHeight]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!filteredReadings.length || !containerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const svgX = (clientX / rect.width) * svgWidth;
    const clampedX = Math.max(padding.left, Math.min(padding.left + graphWidth, svgX));
    const relativeX = (clampedX - padding.left) / graphWidth;
    const index = Math.round(relativeX * (filteredReadings.length - 1));
    if (index >= 0 && index < filteredReadings.length) {
      setHoverIndex(index);
    }
  };

  const activePoint = chartData && hoverIndex !== null ? chartData.points[hoverIndex] : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-xs">
      {/* Chart Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#002855] tracking-tight">
              Evolução Temporal dos Sensores
            </h3>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700">
              {metricConfigs[activeMetric].sensor}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Série temporal transmitida pelo ESP32 via Wi-Fi e sincronizada no ThingSpeak
          </p>
        </div>

        {/* Controls: Metric Tabs + Time Range */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Metric Selector Buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveMetric('uv')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeMetric === 'uv'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Radiação UV (S12ADE)</span>
            </button>
            <button
              onClick={() => setActiveMetric('pressure')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeMetric === 'pressure'
                  ? 'bg-white text-[#002855] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Gauge className="w-3.5 h-3.5 text-[#002855]" />
              <span>Pressão (BMP280)</span>
            </button>
            <button
              onClick={() => setActiveMetric('temperature')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeMetric === 'temperature'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Thermometer className="w-3.5 h-3.5 text-blue-600" />
              <span>Temp (°C)</span>
            </button>
            <button
              onClick={() => setActiveMetric('humidity')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeMetric === 'humidity'
                  ? 'bg-white text-[#00a896] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Droplets className="w-3.5 h-3.5 text-[#00a896]" />
              <span>Umidade (%)</span>
            </button>
          </div>

          {/* Time Range Filter Buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            {(['1h', '6h', '24h', '7d'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  timeRange === range
                    ? 'bg-[#002855] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          {onExportCsv && (
            <button
              onClick={onExportCsv}
              title="Baixar leituras em CSV"
              className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Primary SVG Chart Canvas */}
      <div ref={containerRef} className="relative mt-4 w-full select-none">
        {chartData ? (
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto cursor-crosshair overflow-visible"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverIndex(null)}
          >
            <defs>
              <linearGradient id={chartData.config.gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartData.config.color} stopOpacity="0.22" />
                <stop offset="100%" stopColor={chartData.config.color} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines and Y Labels */}
            {chartData.yTicks.map((tick, idx) => (
              <g key={idx}>
                <line
                  x1={padding.left}
                  y1={tick.y}
                  x2={svgWidth - padding.right}
                  y2={tick.y}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 10}
                  y={tick.y + 4}
                  textAnchor="end"
                  className="text-[11px] fill-slate-400 font-mono"
                >
                  {tick.val.toFixed(1)}
                </text>
              </g>
            ))}

            {/* Gradient Area under curve */}
            <path
              d={chartData.areaD}
              fill={`url(#${chartData.config.gradientId})`}
              className="transition-all duration-300"
            />

            {/* Primary Curve Line */}
            <path
              d={chartData.pathD}
              fill="none"
              stroke={chartData.config.color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300"
            />

            {/* Interactive Crosshair & Tooltip Node */}
            {activePoint && (
              <g>
                <line
                  x1={activePoint.x}
                  y1={padding.top}
                  x2={activePoint.x}
                  y2={padding.top + graphHeight}
                  stroke={chartData.config.color}
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />
                <circle
                  cx={activePoint.x}
                  cy={activePoint.y}
                  r="5.5"
                  fill="#ffffff"
                  stroke={chartData.config.color}
                  strokeWidth="3"
                />
              </g>
            )}

            {/* X-Axis Time Labels */}
            {chartData.points.length > 0 && (
              <>
                <text
                  x={chartData.points[0].x}
                  y={svgHeight - 10}
                  textAnchor="start"
                  className="text-[10px] fill-slate-400 font-mono"
                >
                  {new Date(chartData.points[0].reading.created_at).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </text>
                {chartData.points.length > 2 && (
                  <text
                    x={chartData.points[Math.floor(chartData.points.length / 2)].x}
                    y={svgHeight - 10}
                    textAnchor="middle"
                    className="text-[10px] fill-slate-400 font-mono"
                  >
                    {new Date(
                      chartData.points[Math.floor(chartData.points.length / 2)].reading.created_at
                    ).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </text>
                )}
                <text
                  x={chartData.points[chartData.points.length - 1].x}
                  y={svgHeight - 10}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400 font-mono"
                >
                  {new Date(
                    chartData.points[chartData.points.length - 1].reading.created_at
                  ).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </text>
              </>
            )}
          </svg>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
            Carregando leituras dos sensores...
          </div>
        )}

        {/* Floating Tooltip HUD */}
        {activePoint && chartData && (
          <div
            className="absolute pointer-events-none bg-[#002855] text-white text-xs px-3 py-2 rounded-lg shadow-xl font-mono z-30 transform -translate-x-1/2 -translate-y-full mb-3 border border-slate-700"
            style={{
              left: `${(activePoint.x / svgWidth) * 100}%`,
              top: `${(activePoint.y / svgHeight) * 100}%`,
            }}
          >
            <div className="text-[10px] text-cyan-300 font-sans font-medium">
              {new Date(activePoint.reading.created_at).toLocaleString('pt-BR')}
            </div>
            <div className="text-sm font-bold mt-0.5">
              {chartData.config.formatter(activePoint.value)}
            </div>
            {activeMetric === 'uv' && (
              <div className="text-[10px] text-amber-300 font-sans mt-0.5">
                Tensão ADC: {activePoint.reading.uvRawMv ?? Math.round(activePoint.value * 100)} mV
              </div>
            )}
            {activeMetric === 'pressure' && (
              <div className="text-[10px] text-blue-200 font-sans mt-0.5">
                Altitude barométrica estimada: {activePoint.reading.altitude ?? 915}m
              </div>
            )}
            <div className="text-[10px] text-slate-300 font-sans mt-0.5">
              Registro #{activePoint.reading.entry_id}
            </div>
          </div>
        )}
      </div>

      {/* Summary Telemetry Ribbon */}
      {chartData && (
        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <span className="text-[11px] text-slate-500 uppercase font-medium">Média no Período</span>
            <div className="font-mono text-sm font-bold text-slate-800 mt-0.5">
              {chartData.avg.toFixed(chartData.config.decimals)} {chartData.config.unit}
            </div>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <span className="text-[11px] text-slate-500 uppercase font-medium">Mínima Registrada</span>
            <div className="font-mono text-sm font-bold text-blue-700 mt-0.5">
              {chartData.minVal.toFixed(chartData.config.decimals)} {chartData.config.unit}
            </div>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <span className="text-[11px] text-slate-500 uppercase font-medium">Máxima Registrada</span>
            <div className="font-mono text-sm font-bold text-amber-700 mt-0.5">
              {chartData.maxVal.toFixed(chartData.config.decimals)} {chartData.config.unit}
            </div>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <span className="text-[11px] text-slate-500 uppercase font-medium">Amostras Coletadas</span>
            <div className="font-mono text-sm font-bold text-slate-800 mt-0.5">
              {filteredReadings.length} pacotes
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
