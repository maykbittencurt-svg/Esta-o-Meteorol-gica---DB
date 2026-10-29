import React from 'react';
import { BookOpen, Thermometer, Droplets, Gauge, Sun, Activity, ShieldCheck, Info } from 'lucide-react';

export const ScienceGuide: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2.5 bg-blue-50 text-[#002855] rounded-lg">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#002855]">
              Fundamentação Científica & Tecnologia dos Sensores
            </h2>
            <p className="text-xs text-slate-500">
              Guia didático dos fenômenos físicos, sensores BMP280 e S12ADE e equações meteorológicas
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-600 leading-relaxed">
          O projeto da Estação Meteorológica IoT do Colégio Dom Bosco combina física atmosférica,
          eletrônica com microcontrolador ESP32 de 32-bits e computação em nuvem (IoT). A estação monitora
          em tempo real quatro grandezas ambientais primárias e calcula continuamente indicadores de saúde e
          diagnóstico meteorológico.
        </p>
      </div>

      {/* The 2 Newly Added / Primary Focus Sensors: BMP280 and S12ADE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sensor BMP280 Focus Card */}
        <div className="bg-white rounded-xl border-2 border-indigo-100 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5 text-[#002855]">
              <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                <Gauge className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Sensor de Pressão BMP280
                </h3>
                <span className="text-[11px] font-mono text-indigo-600">Bosch Sensortec (Barômetro Digital I2C)</span>
              </div>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 font-semibold">
              hPa / mbar
            </span>
          </div>

          <div className="mt-4 space-y-3 text-xs text-slate-600 leading-relaxed">
            <p>
              <strong>Princípio Físico:</strong> O BMP280 utiliza uma membrana microscópica de silício com elementos piezorresistivos (tecnologia MEMS). Quando o peso da coluna de ar atmosférico varia sobre o diafragma, a resistência elétrica varia proporcionalmente, sendo convertida por um ADC interno de 20 bits com ruído inferior a 0.2 Pa (~1.7 cm de ar).
            </p>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-900 block mb-1">Equação Hipsométrica de Altitude:</span>
              <p className="font-mono text-[11px] text-[#002855]">
                h = 44330 × [1 - (P / P₀)^(1 / 5.255)]
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Onde P é a pressão lida pelo BMP280 e P₀ é a pressão padrão ao nível do mar (1013.25 hPa).
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-900 block mb-1">Previsão Barométrica do Tempo:</span>
              <ul className="space-y-1 text-slate-600">
                <li>• <strong>Queda rápida (&gt; 1 hPa/h):</strong> Aproximação de frentes frias, tempestades ou centro de baixa pressão.</li>
                <li>• <strong>Elevação (&gt; 1 hPa/h):</strong> Instalação de massa de ar estável (anticiclone) e céu aberto.</li>
                <li>• <strong>Estável (±0.5 hPa/h):</strong> Manutenção do padrão climático local.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Sensor S12ADE UV Focus Card */}
        <div className="bg-white rounded-xl border-2 border-amber-100 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5 text-amber-700">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Sensor de Radiação UV S12ADE
                </h3>
                <span className="text-[11px] font-mono text-amber-600">Fotodiodo de Nitreto de Gálio (GUVA-S12SD)</span>
              </div>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold">
              Índice UVI (0-15)
            </span>
          </div>

          <div className="mt-4 space-y-3 text-xs text-slate-600 leading-relaxed">
            <p>
              <strong>Princípio Físico:</strong> O sensor S12ADE utiliza um fotodiodo semicondutor à base de Nitreto de Gálio (GaN) sensível exclusivamente ao espectro solar ultravioleta (200 nm a 370 nm), cobrindo as faixas UV-A (315-400 nm) e UV-B (280-315 nm). O circuito amplificador operacional gera uma tensão contínua linearmente proporcional à irradiância UV.
            </p>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-900 block mb-1">Conversão de Tensão para Índice UV:</span>
              <p className="font-mono text-[11px] text-amber-800">
                Índice UV ≈ Tensão Analógica (mV) / 100
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Exemplo: 620 mV lidos no pino GPIO 34 da ESP32 equivalem a um Índice UV de 6.2 (Alto risco).
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-900 block mb-1">Escala da OMS (WHO) & Saúde Humana:</span>
              <ul className="space-y-1 text-slate-600">
                <li>• <strong className="text-emerald-700">0 a 2 (Baixo):</strong> Seguro sem fotoproteção (~60 min).</li>
                <li>• <strong className="text-amber-700">3 a 5 (Moderado):</strong> Use camiseta, óculos e FPS 30+ (~45 min).</li>
                <li>• <strong className="text-orange-700">6 a 7 (Alto):</strong> Risco de queimaduras. Sombra ao meio-dia (~30 min).</li>
                <li>• <strong className="text-rose-700">8 a 10 (Muito Alto):</strong> Evite sol direto das 10h às 16h (~15 min).</li>
                <li>• <strong className="text-purple-700">11+ (Extremo):</strong> Risco severo de eritema cutâneo (&lt; 10 min).</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Supporting Sensors: Temperatura & Umidade */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center gap-2.5 text-blue-700 mb-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Thermometer className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Temperatura & Sensação Térmica (Heat Index)
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Mede a energia cinética das moléculas do ar. Quando combinada à umidade relativa elevada, a evaporação do suor é dificultada, aumentando a sensação de calor percebida pelo organismo humano segundo a fórmula de regressão da NOAA.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center gap-2.5 text-[#00a896] mb-3">
            <div className="p-2 bg-[#00a896]/10 rounded-lg">
              <Droplets className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Umidade Relativa & Ponto de Orvalho (Magnus)
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Razão entre a pressão atual do vapor de água e a de saturação. O Ponto de Orvalho calcula a exata temperatura em que o ar precisaria ser resfriado para que ocorra a condensação física do vapor d'água (neblina, nevoeiro ou orvalho).
          </p>
        </div>
      </div>

      {/* IoT Architecture Pipeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-[#002855] uppercase tracking-wider mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-700" />
          <span>Arquitetura de Dados da Estação Meteorológica IoT</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div>
              <span className="font-mono text-blue-700 font-bold">ETAPA 01</span>
              <h4 className="font-bold text-slate-800 mt-1 text-sm">Transdução dos Sensores</h4>
              <p className="text-slate-500 mt-1">
                BMP280 (I2C), S12ADE (Fotodiodo UV analógico) e DHT22 capturam grandezas físicas em tempo real.
              </p>
            </div>
            <div className="mt-3 text-[11px] text-slate-400 font-mono">I2C + ADC12bits</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div>
              <span className="font-mono text-blue-700 font-bold">ETAPA 02</span>
              <h4 className="font-bold text-slate-800 mt-1 text-sm">Processador ESP32</h4>
              <p className="text-slate-500 mt-1">
                Filtra ruídos analógicos com sobreamostragem (16x), calcula UVI e empacota nos 4 canais REST.
              </p>
            </div>
            <div className="mt-3 text-[11px] text-slate-400 font-mono">Wi-Fi 2.4GHz</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div>
              <span className="font-mono text-blue-700 font-bold">ETAPA 03</span>
              <h4 className="font-bold text-slate-800 mt-1 text-sm">ThingSpeak Cloud</h4>
              <p className="text-slate-500 mt-1">
                Armazena e indexa as séries temporais dos 4 campos no canal #3556879 com tolerância a falhas.
              </p>
            </div>
            <div className="mt-3 text-[11px] text-slate-400 font-mono">HTTP POST / GET</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div>
              <span className="font-mono text-blue-700 font-bold">ETAPA 04</span>
              <h4 className="font-bold text-slate-800 mt-1 text-sm">Painel Web & Telão</h4>
              <p className="text-slate-500 mt-1">
                Interface analítica com curvas bezier, cálculo de risco solar OMS, alertas e exportação CSV.
              </p>
            </div>
            <div className="mt-3 text-[11px] text-slate-400 font-mono">React + Tailwind</div>
          </div>
        </div>
      </div>
    </div>
  );
};
