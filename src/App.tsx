import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Thermometer,
  Droplets,
  Gauge,
  Sun,
  RefreshCw,
  AlertTriangle,
  Clock,
  Cpu,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { WeatherReading, StationConfig, TimeRange, ActiveTab } from './types/weather';
import {
  loadConfig,
  saveConfig,
  fetchThingSpeakData,
} from './services/thingspeak';
import {
  evaluateBarometricTrend,
  getHumidityComfort,
  calculateAbsoluteHumidity,
  evaluateUvIndex,
} from './utils/calculations';
import { Header } from './components/Header';
import { MetricCard } from './components/MetricCard';
import { InteractiveChart } from './components/InteractiveChart';
import { PresentationMode } from './components/PresentationMode';
import { ConfigModal } from './components/ConfigModal';
import { Esp32CodeModal } from './components/Esp32CodeModal';
import { ScienceGuide } from './components/ScienceGuide';
import { DataHistoryTable } from './components/DataHistoryTable';

export default function App() {
  const [config, setConfig] = useState<StationConfig>(loadConfig);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [readings, setReadings] = useState<WeatherReading[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isSimulatedFallback, setIsSimulatedFallback] = useState(false);
  const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null);

  // Modais
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);

  // Busca dados do ThingSpeak
  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const result = await fetchThingSpeakData(config, 60);
      setReadings(result.readings);
      setIsSimulatedFallback(result.isSimulatedFallback);
      setApiErrorMessage(result.errorMessage || null);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Erro ao buscar dados:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [config]);

  // Carregamento inicial e polling periódico
  useEffect(() => {
    loadData();
    const intervalMs = Math.max(10, config.refreshInterval) * 1000;
    const interval = setInterval(loadData, intervalMs);
    return () => clearInterval(interval);
  }, [loadData, config.refreshInterval]);

  // Leituras atual e anterior
  const latestReading = useMemo(() => {
    return readings.length > 0 ? readings[readings.length - 1] : null;
  }, [readings]);

  const previousReading = useMemo(() => {
    return readings.length > 1 ? readings[readings.length - 2] : null;
  }, [readings]);

  // Estatísticas calculadas
  const stats = useMemo(() => {
    if (readings.length === 0) {
      return {
        temp: { min: 0, max: 0, avg: 0, delta: 0, history: [] },
        hum: { min: 0, max: 0, avg: 0, delta: 0, history: [] },
        press: { min: 0, max: 0, avg: 0, delta: 0, history: [] },
        uv: { min: 0, max: 0, avg: 0, delta: 0, history: [] },
      };
    }
    const temps = readings.map((r) => r.temperature);
    const hums = readings.map((r) => r.humidity);
    const presses = readings.map((r) => r.pressure);
    const uvs = readings.map((r) => r.uvIndex);

    const deltaT = previousReading ? latestReading!.temperature - previousReading.temperature : 0;
    const deltaH = previousReading ? latestReading!.humidity - previousReading.humidity : 0;
    const deltaP = previousReading ? latestReading!.pressure - previousReading.pressure : 0;
    const deltaU = previousReading ? latestReading!.uvIndex - previousReading.uvIndex : 0;

    return {
      temp: {
        min: Math.min(...temps),
        max: Math.max(...temps),
        avg: temps.reduce((a, b) => a + b, 0) / temps.length,
        delta: deltaT,
        history: temps.slice(-15),
      },
      hum: {
        min: Math.min(...hums),
        max: Math.max(...hums),
        avg: hums.reduce((a, b) => a + b, 0) / hums.length,
        delta: deltaH,
        history: hums.slice(-15),
      },
      press: {
        min: Math.min(...presses),
        max: Math.max(...presses),
        avg: presses.reduce((a, b) => a + b, 0) / presses.length,
        delta: deltaP,
        history: presses.slice(-15),
      },
      uv: {
        min: Math.min(...uvs),
        max: Math.max(...uvs),
        avg: uvs.reduce((a, b) => a + b, 0) / uvs.length,
        delta: deltaU,
        history: uvs.slice(-15),
      },
    };
  }, [readings, latestReading, previousReading]);

  // Salvar configurações
  const handleSaveConfig = (newConfig: StationConfig) => {
    setConfig(newConfig);
    saveConfig(newConfig);
    setTimeout(() => {
      loadData();
    }, 200);
  };

  // Exportar CSV
  const handleExportCsv = () => {
    if (readings.length === 0) return;
    const headers = [
      'ID',
      'Data_Hora',
      'Pressao_BMP280_hPa',
      'Radiacao_UV_S12ADE_UVI',
      'Nivel_Risco_UV',
      'Temperatura_C',
      'Umidade_Relativa_Pct',
      'Ponto_Orvalho_C',
      'Sensacao_Termica_C',
      'Altitude_Estimada_m',
    ];
    const rows = readings.map((r) => {
      const uvAssess = evaluateUvIndex(r.uvIndex);
      return [
        r.entry_id,
        r.created_at,
        r.pressure.toFixed(2),
        r.uvIndex.toFixed(2),
        uvAssess.label,
        r.temperature.toFixed(2),
        r.humidity.toFixed(2),
        r.dewPoint?.toFixed(2) ?? '',
        r.heatIndex?.toFixed(2) ?? '',
        r.altitude ?? '',
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Estacao_DomBosco_BMP280_S12ADE_Canal_${config.channelId}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Exportar JSON
  const handleExportJson = () => {
    if (readings.length === 0) return;
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(readings, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute(
      'download',
      `Estacao_DomBosco_BMP280_S12ADE_${config.channelId}_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parâmetros derivados
  const baroTrend = evaluateBarometricTrend(stats.press.delta);
  const humComfort = getHumidityComfort(latestReading?.humidity ?? 50);
  const uvAssessment = evaluateUvIndex(latestReading?.uvIndex ?? 5.5);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased">
      {/* Top Bar Navigation */}
      <Header
        config={config}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenConfig={() => setIsConfigOpen(true)}
        onOpenPresentation={() => setIsPresentationOpen(true)}
        isSimulatedFallback={isSimulatedFallback}
        lastUpdated={lastUpdated}
        isRefreshing={isRefreshing}
        onManualRefresh={loadData}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Info Alert Banner if ThingSpeak channel requires Read API Key or simulated */}
        {apiErrorMessage && !config.isSimulation && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-amber-950">Aviso da Conexão ThingSpeak:</strong>{' '}
                <span>{apiErrorMessage}</span>
              </div>
            </div>
            <button
              onClick={() => setIsConfigOpen(true)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shrink-0 transition-colors shadow-xs"
            >
              Configurar Chaves
            </button>
          </div>
        )}

        {/* Tab Content 1: Dashboard Principal */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Project Hero Header */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                  <span className="font-semibold text-[#002855]">Colégio Dom Bosco</span>
                  <span aria-hidden="true">•</span>
                  <span>Mostra de Ciências & Tecnologia</span>
                  <span aria-hidden="true">•</span>
                  <span>Canal ThingSpeak #{config.channelId}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#002855] tracking-tight">
                  Estação Meteorológica IoT com BMP280 & S12ADE
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  Sistema autônomo baseado no microcontrolador ESP32 com barômetro digital de alta precisão{' '}
                  <strong>BMP280</strong> e sensor de radiação ultravioleta <strong>S12ADE / GUVA-S12SD</strong>.
                  Monitoramento contínuo de pressão atmosférica, índice UV da OMS e microclima.
                </p>
              </div>

              {/* Status and Refresh Pill */}
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                  <Clock className="w-3.5 h-3.5 text-blue-700" />
                  <span>
                    Última Leitura:{' '}
                    <strong className="text-slate-900 font-mono">
                      {lastUpdated
                        ? lastUpdated.toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })
                        : '--:--:--'}
                    </strong>
                  </span>
                </div>
                <button
                  onClick={loadData}
                  disabled={isRefreshing}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#002855] ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>{isRefreshing ? 'Atualizando...' : 'Atualizar'}</span>
                </button>
              </div>
            </div>

            {/* 4 Core Sensor Cards Grid with BMP280 and S12ADE UV prominently featured */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Card 1: Radiação UV S12ADE */}
              <MetricCard
                title="Radiação Ultravioleta"
                value={latestReading?.uvIndex ?? 5.5}
                unit="UVI"
                icon={Sun}
                subLabel="Tensão Fotodiodo"
                subValue={`${latestReading?.uvRawMv ?? Math.round((latestReading?.uvIndex ?? 5.5) * 100)} mV`}
                sensorBadge="S12ADE / GUVA"
                statusBadge={{
                  text: `${uvAssessment.label} • ${uvAssessment.sunscreenSpf}`,
                  bgColor: uvAssessment.bgColor,
                  textColor: uvAssessment.textColor,
                  borderColor: uvAssessment.borderColor,
                }}
                min={stats.uv.min}
                max={stats.uv.max}
                delta={stats.uv.delta}
                deltaUnit=" UVI"
                colorTheme="amber"
                historyValues={stats.uv.history}
                decimalPlaces={1}
              />

              {/* Card 2: Pressão Barométrica BMP280 */}
              <MetricCard
                title="Pressão Atmosférica"
                value={latestReading?.pressure ?? 1014.2}
                unit="hPa"
                icon={Gauge}
                subLabel="Tendência"
                subValue={baroTrend.label}
                sensorBadge="BMP280 (Bosch)"
                statusBadge={{
                  text: baroTrend.forecast.split('(')[0],
                  bgColor: 'bg-indigo-50',
                  textColor: 'text-indigo-800',
                  borderColor: 'border-indigo-200',
                }}
                min={stats.press.min}
                max={stats.press.max}
                delta={stats.press.delta}
                deltaUnit=" hPa"
                colorTheme="navy"
                historyValues={stats.press.history}
                decimalPlaces={1}
              />

              {/* Card 3: Temperatura */}
              <MetricCard
                title="Temperatura Ambiente"
                value={latestReading?.temperature ?? 22.8}
                unit="°C"
                icon={Thermometer}
                subLabel="Sensação Térmica"
                subValue={`${latestReading?.heatIndex?.toFixed(1) ?? '--'} °C`}
                sensorBadge="DHT22 / BMP280"
                min={stats.temp.min}
                max={stats.temp.max}
                delta={stats.temp.delta}
                deltaUnit="°C"
                colorTheme="blue"
                historyValues={stats.temp.history}
                decimalPlaces={1}
              />

              {/* Card 4: Umidade Relativa */}
              <MetricCard
                title="Umidade Relativa"
                value={latestReading?.humidity ?? 58.0}
                unit="%"
                icon={Droplets}
                subLabel="Ponto de Orvalho"
                subValue={`${latestReading?.dewPoint?.toFixed(1) ?? '--'} °C`}
                sensorBadge="DHT22 Digital"
                min={stats.hum.min}
                max={stats.hum.max}
                delta={stats.hum.delta}
                deltaUnit="%"
                colorTheme="cyan"
                historyValues={stats.hum.history}
                decimalPlaces={1}
              />
            </div>

            {/* Special Scientific Advisory Cards for S12ADE UV and BMP280 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Box 1: Fotoproteção e Saúde Solar (S12ADE) */}
              <div className="bg-white rounded-xl border border-amber-200 p-5 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-amber-500" />
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Índice UV (OMS) & Recomendações de Saúde Escolar
                    </span>
                  </div>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded text-white"
                    style={{ backgroundColor: uvAssessment.color }}
                  >
                    {uvAssessment.label}
                  </span>
                </div>
                <div className="mt-3.5 space-y-2 text-xs">
                  <p className="text-slate-700 leading-relaxed">
                    <strong>Diagnóstico do Sensor S12ADE:</strong> {uvAssessment.recommendation}
                  </p>
                  <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] font-mono">
                    <div className="bg-amber-50/70 p-2 rounded-lg border border-amber-100">
                      <span className="text-slate-500 block">Fotoproteção:</span>
                      <strong className="text-amber-800">{uvAssessment.sunscreenSpf}</strong>
                    </div>
                    <div className="bg-amber-50/70 p-2 rounded-lg border border-amber-100">
                      <span className="text-slate-500 block">Exposição segura:</span>
                      <strong className="text-amber-800">~{uvAssessment.maxSunExposureMinutes} min</strong>
                    </div>
                    <div className="bg-amber-50/70 p-2 rounded-lg border border-amber-100">
                      <span className="text-slate-500 block">Tensão ADC:</span>
                      <strong className="text-amber-800">
                        {latestReading?.uvRawMv ?? Math.round((latestReading?.uvIndex ?? 5.5) * 100)} mV
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Box 2: Diagnóstico Barométrico (BMP280) */}
              <div className="bg-white rounded-xl border border-indigo-200 p-5 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-indigo-600" />
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-indigo-700" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Análise Barométrica (BMP280) & Tendência do Tempo
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-800">
                    {baroTrend.label}
                  </span>
                </div>
                <div className="mt-3.5 space-y-2 text-xs">
                  <p className="text-slate-700 leading-relaxed">
                    <strong>Previsão Física a Curto Prazo:</strong> {baroTrend.forecast}. Variação barométrica de{' '}
                    <strong className="font-mono">{stats.press.delta >= 0 ? `+${stats.press.delta.toFixed(2)}` : stats.press.delta.toFixed(2)} hPa</strong>.
                  </p>
                  <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] font-mono">
                    <div className="bg-indigo-50/70 p-2 rounded-lg border border-indigo-100">
                      <span className="text-slate-500 block">Altitude Est.:</span>
                      <strong className="text-indigo-900">{latestReading?.altitude ?? 915} metros</strong>
                    </div>
                    <div className="bg-indigo-50/70 p-2 rounded-lg border border-indigo-100">
                      <span className="text-slate-500 block">Pressão Nível Mar:</span>
                      <strong className="text-indigo-900">{latestReading?.seaLevelPressure ?? 1013.2} hPa</strong>
                    </div>
                    <div className="bg-indigo-50/70 p-2 rounded-lg border border-indigo-100">
                      <span className="text-slate-500 block">Endereço I2C:</span>
                      <strong className="text-indigo-900">0x76 / 0x77</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Bezier SVG Chart */}
            <InteractiveChart
              readings={readings}
              timeRange={timeRange}
              setTimeRange={setTimeRange}
              onExportCsv={handleExportCsv}
            />

            {/* Quick Fair Highlights / Hardware Teaser */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                    <Cpu className="w-4 h-4 text-blue-700" />
                    <span>Hardware: ESP32 + BMP280 + S12ADE</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    A estação utiliza o microcontrolador ESP32 de núcleo duplo operando a 240MHz,
                    integrado ao sensor barométrico I2C <strong>BMP280</strong> (pinos 21 SDA e 22 SCL) e ao fotodiodo
                    de radiação ultravioleta <strong>S12ADE</strong> no canal ADC GPIO 34.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-mono">Firmware C++ / Arduino IDE</span>
                  <button
                    onClick={() => setActiveTab('esp32')}
                    className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1"
                  >
                    <span>Ver código & pinagem</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                    <ShieldCheck className="w-4 h-4 text-[#00a896]" />
                    <span>Conexão Nuvem ThingSpeak (4 Campos)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Os dados são transmitidos via requisições HTTP REST diretamente para a nuvem
                    ThingSpeak da MathWorks: <strong>Field 1 (Temp)</strong>, <strong>Field 2 (Umidade)</strong>,{' '}
                    <strong>Field 3 (Pressão BMP280)</strong> e <strong>Field 4 (Índice UV S12ADE)</strong>.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-mono">Canal ID: {config.channelId}</span>
                  <button
                    onClick={() => setIsConfigOpen(true)}
                    className="text-xs font-semibold text-[#002855] hover:text-[#07192f] flex items-center gap-1"
                  >
                    <span>Configurações da chave</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 2: Histórico Completo & Registros */}
        {activeTab === 'history' && (
          <DataHistoryTable
            readings={readings}
            onExportCsv={handleExportCsv}
            onExportJson={handleExportJson}
          />
        )}

        {/* Tab Content 3: Metodologia Científica & Sensores */}
        {activeTab === 'science' && <ScienceGuide />}

        {/* Tab Content 4: ESP32 Firmware & Circuito */}
        {activeTab === 'esp32' && <Esp32CodeModal config={config} />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">Colégio Dom Bosco</span>
            <span className="text-slate-300">•</span>
            <span>Estação Meteorológica IoT: BMP280 + S12ADE UV</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
            <span>ESP32 NodeMCU</span>
            <span>•</span>
            <span>ThingSpeak ID {config.channelId}</span>
            <span>•</span>
            <span>Mostra de Ciências</span>
          </div>
        </div>
      </footer>

      {/* Config Modal */}
      <ConfigModal
        config={config}
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onSave={handleSaveConfig}
        onRefreshData={loadData}
      />

      {/* Presentation Kiosk Mode */}
      {isPresentationOpen && (
        <PresentationMode
          latestReading={latestReading}
          previousReading={previousReading}
          config={config}
          onClose={() => setIsPresentationOpen(false)}
          isSimulatedFallback={isSimulatedFallback}
        />
      )}
    </div>
  );
}
