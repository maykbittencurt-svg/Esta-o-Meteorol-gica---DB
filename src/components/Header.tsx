import React, { useState } from 'react';
import { Settings, Maximize2, Radio, Sun, Gauge, Sparkles } from 'lucide-react';
import { ActiveTab, StationConfig } from '../types/weather';

interface HeaderProps {
  config: StationConfig;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenConfig: () => void;
  onOpenPresentation: () => void;
  isSimulatedFallback: boolean;
  lastUpdated: Date | null;
  isRefreshing: boolean;
  onManualRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  activeTab,
  setActiveTab,
  onOpenConfig,
  onOpenPresentation,
  isSimulatedFallback,
  lastUpdated,
  isRefreshing,
  onManualRefresh,
}) => {
  const [imageError, setImageError] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Banner Notice for Science Fair presentation context */}
      <div className="bg-[#002855] text-white text-xs py-1.5 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
          <span className="font-semibold tracking-wide uppercase text-blue-200">Mostra Científica</span>
          <span className="text-blue-400">•</span>
          <span className="text-slate-200">Estação Meteorológica IoT: ESP32 + BMP280 + S12ADE UV</span>
          <span className="hidden md:inline text-blue-400">•</span>
          <span className="hidden md:inline text-slate-300">
            Canal ThingSpeak: <code className="font-mono text-cyan-300">{config.channelId}</code>
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs">
            <Radio
              className={`w-3.5 h-3.5 ${
                isSimulatedFallback ? 'text-amber-300' : 'text-emerald-400 animate-pulse'
              }`}
            />
            <span className="font-mono text-[11px] text-slate-200">
              {isSimulatedFallback ? 'Simulação (Amostras Ativas)' : 'ESP32 Conectada (Live)'}
            </span>
          </div>
        </div>
      </div>

      {/* Main 3-Zone Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Brand & Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center">
            {!imageError ? (
              <img
                src="/assets/aistudio/image_37c9c41d.png"
                alt="Colégio Dom Bosco"
                className="h-10 md:h-11 w-auto object-contain"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="h-10 px-3 bg-[#002855] text-white rounded-lg flex items-center gap-2 shadow-xs">
                <span className="font-black text-sm tracking-wider text-cyan-400">DOM BOSCO</span>
              </div>
            )}
          </div>
          <div className="h-7 w-px bg-slate-200 hidden sm:block" />
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider text-[#002855] flex items-center gap-1.5">
              Estação Meteorológica IoT
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Pressão BMP280 & Radiação UV S12ADE
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links / Tabs */}
        <nav className="hidden lg:flex items-center gap-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-blue-50 text-[#002855] font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Painel Geral
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-blue-50 text-[#002855] font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Dados & Registros
          </button>
          <button
            onClick={() => setActiveTab('science')}
            className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'science'
                ? 'bg-blue-50 text-[#002855] font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Metodologia & Sensores
          </button>
          <button
            onClick={() => setActiveTab('esp32')}
            className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'esp32'
                ? 'bg-blue-50 text-[#002855] font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            ESP32, BMP280 & S12ADE
          </button>
        </nav>

        {/* Zone 3: Primary Action & Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onOpenConfig}
            title="Configurações do Canal ThingSpeak"
            className="p-2 sm:px-3 sm:py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Settings className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">ThingSpeak</span>
          </button>
          <button
            onClick={onOpenPresentation}
            className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-[#002855] hover:bg-[#07192f] rounded-lg transition-all shadow-xs flex items-center gap-2 whitespace-nowrap"
          >
            <Maximize2 className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Modo Telão (Mostra)</span>
            <span className="sm:hidden">Telão</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Strip */}
      <div className="lg:hidden flex border-t border-slate-200 overflow-x-auto px-4 py-1.5 gap-1 bg-slate-50">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'dashboard' ? 'bg-[#002855] text-white' : 'text-slate-600'
          }`}
        >
          Painel Geral
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'history' ? 'bg-[#002855] text-white' : 'text-slate-600'
          }`}
        >
          Histórico
        </button>
        <button
          onClick={() => setActiveTab('science')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'science' ? 'bg-[#002855] text-white' : 'text-slate-600'
          }`}
        >
          Ciência & Sensores
        </button>
        <button
          onClick={() => setActiveTab('esp32')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'esp32' ? 'bg-[#002855] text-white' : 'text-slate-600'
          }`}
        >
          ESP32 & Circuito
        </button>
      </div>
    </header>
  );
};
