import React, { useState } from 'react';
import { X, Key, Radio, RefreshCw, Send, CheckCircle2, AlertCircle, ExternalLink, Sun, Gauge } from 'lucide-react';
import { StationConfig } from '../types/weather';
import { sendTestReadingToThingSpeak } from '../services/thingspeak';

interface ConfigModalProps {
  config: StationConfig;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newConfig: StationConfig) => void;
  onRefreshData: () => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  config,
  isOpen,
  onClose,
  onSave,
  onRefreshData,
}) => {
  const [formData, setFormData] = useState<StationConfig>({ ...config });
  const [testTemp, setTestTemp] = useState(24.5);
  const [testHum, setTestHum] = useState(55.0);
  const [testPress, setTestPress] = useState(1013.25);
  const [testUv, setTestUv] = useState(6.2);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleSendTest = async () => {
    setIsSendingTest(true);
    setTestResult(null);
    try {
      const res = await sendTestReadingToThingSpeak(
        formData.writeApiKey,
        testTemp,
        testHum,
        testPress,
        testUv
      );
      setTestResult(res);
      if (res.success) {
        setTimeout(() => {
          onRefreshData();
        }, 1500);
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Erro ao comunicar com o servidor ThingSpeak.',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-[#002855] rounded-lg">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Configurações da Conexão ThingSpeak
              </h2>
              <p className="text-xs text-slate-500">
                Canais, chaves de API e mapeamento de sensores
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Channel ID */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Channel ID
            </label>
            <input
              type="text"
              value={formData.channelId}
              onChange={(e) => setFormData({ ...formData, channelId: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-[#002855]"
              placeholder="3556879"
              required
            />
          </div>

          {/* Write API Key */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Write API Key (Gravação da ESP32)
            </label>
            <input
              type="text"
              value={formData.writeApiKey}
              onChange={(e) => setFormData({ ...formData, writeApiKey: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-[#002855]"
              placeholder="XU1PSONID5VM7KS6"
              required
            />
          </div>

          {/* Read API Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Read API Key
              </label>
              <span className="text-[11px] text-amber-600 font-medium">
                (Necessária se o canal for Privado)
              </span>
            </div>
            <input
              type="text"
              value={formData.readApiKey}
              onChange={(e) => setFormData({ ...formData, readApiKey: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-[#002855]"
              placeholder="Opcional se o canal for público"
            />
          </div>

          {/* Field Mapping Guide */}
          <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-slate-700">
            <span className="font-bold text-[#002855] block mb-1">Mapeamento de Campos ThingSpeak:</span>
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div>• Field 1: Temperatura (°C)</div>
              <div>• Field 2: Umidade (%)</div>
              <div>• Field 3: Pressão BMP280 (hPa)</div>
              <div>• Field 4: Radiação UV S12ADE</div>
            </div>
          </div>

          {/* Refresh Interval & Simulation */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Intervalo de Atualização
              </label>
              <select
                value={formData.refreshInterval}
                onChange={(e) =>
                  setFormData({ ...formData, refreshInterval: parseInt(e.target.value, 10) })
                }
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-[#002855]"
              >
                <option value={15}>15 segundos (Padrão)</option>
                <option value={20}>20 segundos</option>
                <option value={30}>30 segundos</option>
                <option value={60}>60 segundos (1 min)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Fonte dos Dados
              </label>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isSimulation: !formData.isSimulation })}
                className={`w-full px-3 py-2.5 rounded-lg border text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                  formData.isSimulation
                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>{formData.isSimulation ? 'Simulação Ativa' : 'ThingSpeak Live'}</span>
              </button>
            </div>
          </div>

          {/* Direct Test Sender Tool with BMP280 and S12ADE UV */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800">
                Disparar Amostra de Teste (4 Canais)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Valida BMP280 e S12ADE
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] text-slate-500">Temp (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={testTemp}
                  onChange={(e) => setTestTemp(parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 border rounded-sm text-xs font-mono bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500">Umidade (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={testHum}
                  onChange={(e) => setTestHum(parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 border rounded-sm text-xs font-mono bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500">BMP280 (hPa)</label>
                <input
                  type="number"
                  step="0.1"
                  value={testPress}
                  onChange={(e) => setTestPress(parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 border rounded-sm text-xs font-mono bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500">S12ADE (UVI)</label>
                <input
                  type="number"
                  step="0.1"
                  value={testUv}
                  onChange={(e) => setTestUv(parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 border rounded-sm text-xs font-mono bg-white"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSendTest}
              disabled={isSendingTest}
              className="mt-3 w-full py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isSendingTest ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#002855]" />
              ) : (
                <Send className="w-3.5 h-3.5 text-[#002855]" />
              )}
              <span>{isSendingTest ? 'Transmitindo pacote...' : 'Enviar Pacote para ThingSpeak'}</span>
            </button>

            {testResult && (
              <div
                className={`mt-2 p-2 rounded-md text-xs flex items-center gap-2 ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Quick link to ThingSpeak channel */}
          <div className="pt-2 text-center">
            <a
              href={`https://thingspeak.mathworks.com/channels/${formData.channelId || '3556879'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-700 hover:underline font-medium"
            >
              <span>Abrir canal #{formData.channelId || '3556879'} no ThingSpeak</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-[#002855] hover:bg-[#07192f] rounded-lg transition-colors shadow-xs"
            >
              Salvar Configurações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
