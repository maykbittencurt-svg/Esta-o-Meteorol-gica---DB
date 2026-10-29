import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Thermometer,
  Droplets,
  Gauge,
  Sun,
  Minimize2,
  Radio,
  Clock,
  ShieldAlert,
  Sparkles,
  CloudSun,
} from 'lucide-react';
import { WeatherReading, StationConfig } from '../types/weather';
import {
  evaluateBarometricTrend,
  getHumidityComfort,
  evaluateUvIndex,
} from '../utils/calculations';

interface PresentationModeProps {
  latestReading: WeatherReading | null;
  previousReading: WeatherReading | null;
  config: StationConfig;
  onClose: () => void;
  isSimulatedFallback: boolean;
}

export const PresentationMode: React.FC<PresentationModeProps> = ({
  latestReading,
  previousReading,
  config,
  onClose,
  isSimulatedFallback,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(config.refreshInterval);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? config.refreshInterval : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [config.refreshInterval]);

  const temp = latestReading?.temperature ?? 22.8;
  const hum = latestReading?.humidity ?? 58.0;
  const press = latestReading?.pressure ?? 1014.2;
  const uv = latestReading?.uvIndex ?? 5.4;

  const prevPress = previousReading?.pressure ?? press;
  const pressDelta = press - prevPress;
  const trend = evaluateBarometricTrend(pressDelta);
  const humComfort = getHumidityComfort(hum);
  const uvAssessment = evaluateUvIndex(uv);

  return (
    <div className="fixed inset-0 z-50 bg-[#07192f] text-white flex flex-col justify-between p-6 md:p-10 overflow-y-auto">
      {/* Top Banner & Dom Bosco Branding */}
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-6">
        <div className="flex items-center gap-5">
          <div className="bg-white p-2 rounded-xl shadow-md">
            {!imageError ? (
              <img
                src="/assets/aistudio/image_37c9c41d.png"
                alt="Colégio Dom Bosco"
                className="h-10 md:h-12 w-auto object-contain"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="h-10 px-3 bg-[#002855] text-white rounded-lg flex items-center">
                <span className="font-black text-sm tracking-wider text-cyan-400">DOM BOSCO</span>
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-widest text-cyan-400">
                Mostra Científica • Colégio Dom Bosco
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-xs font-mono text-slate-300">
                Canal #{config.channelId}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-0.5">
              Estação Meteorológica IoT com BMP280 e S12ADE
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end text-right font-mono text-xs">
            <div className="flex items-center gap-2">
              <Radio
                className={`w-3.5 h-3.5 ${
                  isSimulatedFallback ? 'text-amber-400' : 'text-emerald-400 animate-pulse'
                }`}
              />
              <span className="text-slate-300">
                {isSimulatedFallback ? 'Modo Demonstração Ativo' : 'ESP32 Conectada'}
              </span>
            </div>
            <div className="text-slate-400 text-[11px] mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>Próxima leitura em {secondsLeft}s</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors flex items-center gap-2 text-sm font-semibold border border-slate-700"
          >
            <Minimize2 className="w-4 h-4" />
            <span className="hidden sm:inline">Sair do Telão</span>
          </button>
        </div>
      </div>

      {/* Main 4 Big Dial Readouts for Scientific Fair Exhibition */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 my-8">
        {/* Dial 1: Temperatura */}
        <motion.div
          key={`temp-${temp}`}
          initial={{ scale: 0.98, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-slate-900/80 rounded-2xl border border-blue-500/30 p-6 flex flex-col justify-between relative overflow-hidden backdrop-blur-xs shadow-2xl"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 to-cyan-400" />
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                Temperatura
              </span>
              <span className="text-[10px] font-mono text-slate-400 block">Sensor DHT22 / BMP280</span>
            </div>
            <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Thermometer className="w-6 h-6" />
            </div>
          </div>
          <div className="my-5">
            <div className="flex items-baseline">
              <span className="text-5xl lg:text-6xl font-mono font-extrabold tracking-tight text-white tabular-nums">
                {temp.toFixed(1)}
              </span>
              <span className="text-2xl font-mono font-bold text-blue-400 ml-1.5">°C</span>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
            <div>
              <span className="text-slate-400">Sensação:</span>{' '}
              <strong className="text-white font-mono">
                {latestReading?.heatIndex?.toFixed(1) ?? temp.toFixed(1)} °C
              </strong>
            </div>
            <div className="font-mono text-cyan-300 text-[11px]">
              Orvalho: {latestReading?.dewPoint?.toFixed(1) ?? '--'}°C
            </div>
          </div>
        </motion.div>

        {/* Dial 2: Umidade Relativa */}
        <motion.div
          key={`hum-${hum}`}
          initial={{ scale: 0.98, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-slate-900/80 rounded-2xl border border-[#00a896]/30 p-6 flex flex-col justify-between relative overflow-hidden backdrop-blur-xs shadow-2xl"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00a896] to-emerald-400" />
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                Umidade Relativa
              </span>
              <span className="text-[10px] font-mono text-slate-400 block">Higrômetro Digital</span>
            </div>
            <div className="p-2.5 bg-[#00a896]/20 text-cyan-300 rounded-xl border border-[#00a896]/30">
              <Droplets className="w-6 h-6" />
            </div>
          </div>
          <div className="my-5">
            <div className="flex items-baseline">
              <span className="text-5xl lg:text-6xl font-mono font-extrabold tracking-tight text-white tabular-nums">
                {hum.toFixed(1)}
              </span>
              <span className="text-2xl font-mono font-bold text-cyan-300 ml-1.5">%</span>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
            <div>
              <span className="text-slate-400">Status:</span>{' '}
              <strong className="text-cyan-300">{humComfort.text}</strong>
            </div>
            <div className="font-mono text-slate-400 text-[11px]">Faixa ideal: 40-70%</div>
          </div>
        </motion.div>

        {/* Dial 3: Pressão BMP280 */}
        <motion.div
          key={`press-${press}`}
          initial={{ scale: 0.98, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-slate-900/80 rounded-2xl border border-indigo-500/30 p-6 flex flex-col justify-between relative overflow-hidden backdrop-blur-xs shadow-2xl"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-700 to-indigo-500" />
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                Pressão Atmosférica
              </span>
              <span className="text-[10px] font-mono text-indigo-400 font-semibold block">
                Sensor BMP280 (I2C)
              </span>
            </div>
            <div className="p-2.5 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-500/30">
              <Gauge className="w-6 h-6" />
            </div>
          </div>
          <div className="my-5">
            <div className="flex items-baseline">
              <span className="text-4xl lg:text-5xl font-mono font-extrabold tracking-tight text-white tabular-nums">
                {press.toFixed(1)}
              </span>
              <span className="text-xl font-mono font-bold text-indigo-400 ml-1.5">hPa</span>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
            <div>
              <span className="text-slate-400">Tendência:</span>{' '}
              <strong className="text-cyan-300">{trend.label}</strong>
            </div>
            <div className="font-mono text-slate-400 text-[11px]">
              Alt: {latestReading?.altitude ?? 915}m
            </div>
          </div>
        </motion.div>

        {/* Dial 4: Radiação Ultravioleta S12ADE */}
        <motion.div
          key={`uv-${uv}`}
          initial={{ scale: 0.98, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-slate-900/80 rounded-2xl border border-amber-500/40 p-6 flex flex-col justify-between relative overflow-hidden backdrop-blur-xs shadow-2xl"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-purple-600" />
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Radiação Ultravioleta
              </span>
              <span className="text-[10px] font-mono text-amber-400 font-semibold block">
                Sensor S12ADE / GUVA
              </span>
            </div>
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Sun className="w-6 h-6" />
            </div>
          </div>
          <div className="my-5">
            <div className="flex items-baseline">
              <span className="text-5xl lg:text-6xl font-mono font-extrabold tracking-tight text-white tabular-nums">
                {uv.toFixed(1)}
              </span>
              <span className="text-xl font-mono font-bold text-amber-400 ml-1.5">UVI</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span
                className="inline-block px-2.5 py-0.5 rounded text-xs font-bold"
                style={{ backgroundColor: uvAssessment.color, color: '#ffffff' }}
              >
                {uvAssessment.label}
              </span>
              <span className="text-xs text-slate-300 font-mono">
                {uvAssessment.sunscreenSpf}
              </span>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
            <div>
              <span className="text-slate-400">Max sol s/ proteção:</span>{' '}
              <strong className="text-amber-300 font-mono">
                ~{uvAssessment.maxSunExposureMinutes} min
              </strong>
            </div>
            <div className="font-mono text-slate-400 text-[11px]">
              ADC: {latestReading?.uvRawMv ?? Math.round(uv * 100)}mV
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Science Exhibition Summary Ribbon */}
      <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-900/50 text-cyan-300 rounded-lg shrink-0">
            <CloudSun className="w-6 h-6" />
          </div>
          <div>
            <div className="font-bold text-white text-sm">
              Diagnóstico Integrado: Pressão BMP280 & Índice Solar S12ADE
            </div>
            <div className="text-slate-300 mt-0.5">
              Barômetro indica <strong>{trend.forecast}</strong>. Radiação UV classificada como{' '}
              <strong style={{ color: uvAssessment.color }}>{uvAssessment.label}</strong>:{' '}
              {uvAssessment.recommendation}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px] shrink-0">
          <span>ESP32 NodeMCU</span>
          <span>•</span>
          <span>BMP280 (I2C)</span>
          <span>•</span>
          <span>S12ADE (ADC)</span>
          <span>•</span>
          <span>ThingSpeak Cloud</span>
        </div>
      </div>
    </div>
  );
};
