import { UvAssessment } from '../types/weather';

/**
 * Funções científicas e meteorológicas para a Estação IoT Dom Bosco
 */

/**
 * Calcula o Ponto de Orvalho (°C) pela aproximação Magnus-Tetens
 */
export function calculateDewPoint(temperature: number, humidity: number): number {
  if (humidity <= 0) return 0;
  const a = 17.27;
  const b = 237.7;
  const alpha = ((a * temperature) / (b + temperature)) + Math.log(humidity / 100.0);
  const dewPoint = (b * alpha) / (a - alpha);
  return Number(dewPoint.toFixed(1));
}

/**
 * Calcula a Sensação Térmica (°C) pela fórmula de regressão de Rothfusz (NOAA)
 */
export function calculateHeatIndex(temperature: number, humidity: number): number {
  if (temperature < 20) {
    return Number(temperature.toFixed(1));
  }
  const T = (temperature * 9) / 5 + 32;
  const RH = humidity;
  let HI = 0.5 * (T + 61.0 + ((T - 68.0) * 1.2) + (RH * 0.094));

  if (HI >= 80) {
    HI = -42.379 +
      2.04901523 * T +
      10.14333127 * RH -
      0.22475541 * T * RH -
      0.00683783 * T * T -
      0.05481717 * RH * RH +
      0.00122874 * T * T * RH +
      0.00085282 * T * RH * RH -
      0.00000199 * T * T * RH * RH;
  }
  const hiCelsius = ((HI - 32) * 5) / 9;
  return Number(hiCelsius.toFixed(1));
}

/**
 * Calcula altitude barométrica em metros baseada no sensor BMP280
 * Equação barométrica internacional da ICAO (P0 = 1013.25 hPa)
 */
export function calculateAltitude(pressureHpa: number, seaLevelHpa = 1013.25): number {
  if (pressureHpa <= 0) return 0;
  const altitude = 44330 * (1 - Math.pow(pressureHpa / seaLevelHpa, 1 / 5.255));
  return Math.round(altitude);
}

/**
 * Calcula a Pressão Reduzida ao Nível do Mar (QNH) a partir da pressão medida pelo BMP280
 * e da altitude local da estação em metros (ex: Curitiba ~915m)
 */
export function calculateSeaLevelPressure(stationPressureHpa: number, altitudeMeters = 915): number {
  if (stationPressureHpa <= 0) return 1013.25;
  // Equação barométrica inversa considerando gradiente térmico de 0.0065 K/m
  const seaLevel = stationPressureHpa * Math.pow(1 - (0.0065 * altitudeMeters) / 288.15, -5.255);
  return Number(seaLevel.toFixed(1));
}

/**
 * Avalia o Índice de Radiação Ultravioleta (UVI) medido pelo sensor S12ADE / GUVA-S12SD
 * Baseado na escala oficial da Organização Mundial da Saúde (OMS / WHO)
 */
export function evaluateUvIndex(uvIndex: number): UvAssessment {
  const index = Math.max(0, Number(uvIndex.toFixed(1)));

  if (index < 3.0) {
    return {
      index,
      level: 'low',
      label: 'Baixo (Seguro)',
      color: '#10b981', // Verde
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      textColor: 'text-emerald-700',
      recommendation: 'Baixo risco para a maioria das pessoas. Não é obrigatório proteção, mas óculos escuros são bem-vindos em dias claros.',
      maxSunExposureMinutes: 60,
      sunscreenSpf: 'FPS 15+',
    };
  } else if (index < 6.0) {
    return {
      index,
      level: 'moderate',
      label: 'Moderado',
      color: '#f59e0b', // Amarelo/Âmbar
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      textColor: 'text-amber-800',
      recommendation: 'Risco moderado de danos. Use camiseta, boné e protetor solar FPS 30+. Procure sombra por volta do meio-dia.',
      maxSunExposureMinutes: 45,
      sunscreenSpf: 'FPS 30+',
    };
  } else if (index < 8.0) {
    return {
      index,
      level: 'high',
      label: 'Alto (Alerta)',
      color: '#f97316', // Laranja
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-800',
      recommendation: 'Alto risco de queimaduras solares. Proteção solar obrigatória. Reduza a exposição direta entre 10h e 16h.',
      maxSunExposureMinutes: 30,
      sunscreenSpf: 'FPS 50+',
    };
  } else if (index < 11.0) {
    return {
      index,
      level: 'very_high',
      label: 'Muito Alto (Perigo)',
      color: '#ef4444', // Vermelho
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200',
      textColor: 'text-rose-800',
      recommendation: 'Risco muito alto! Queimaduras solares podem ocorrer rapidamente. Fique na sombra, use camisa de manga longa, chapéu e FPS 50+ reaplicado.',
      maxSunExposureMinutes: 15,
      sunscreenSpf: 'FPS 50+ a 70',
    };
  } else {
    return {
      index,
      level: 'extreme',
      label: 'Extremo (Crítico)',
      color: '#8b5cf6', // Roxo / Violeta
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-800',
      recommendation: 'Risco extremo de eritema cutâneo e dano ocular em minutos. Evite qualquer exposição ao ar livre nos horários de pico.',
      maxSunExposureMinutes: 10,
      sunscreenSpf: 'FPS 70+ / Evitar sol',
    };
  }
}

/**
 * Converte a tensão analógica em milivolts (mV) do fotodiodo S12ADE para Índice UV
 * A curva padrão do sensor GUVA-S12SD / S12ADE: ~1 UVI para cada 100mV
 */
export function convertUvMvToIndex(millivolts: number): number {
  if (millivolts <= 50) return 0.0;
  // Calibração empírica padrão: UVI = (mV - 50) / 100 + 0.5
  const uvi = millivolts / 100.0;
  return Number(Math.min(15, Math.max(0, uvi)).toFixed(1));
}

/**
 * Calcula a Umidade Absoluta em g/m³
 */
export function calculateAbsoluteHumidity(temperature: number, humidity: number): number {
  const satVaporPress = 6.112 * Math.exp((17.67 * temperature) / (temperature + 243.5));
  const vaporPress = (satVaporPress * humidity) / 100;
  const absHum = (vaporPress * 216.7) / (temperature + 273.15);
  return Number(absHum.toFixed(2));
}

/**
 * Avalia a tendência barométrica a partir do delta de pressão medido pelo sensor BMP280
 */
export function evaluateBarometricTrend(pressureDelta: number): {
  trend: 'rising' | 'falling' | 'steady';
  label: string;
  forecast: string;
  color: string;
} {
  if (pressureDelta > 0.8) {
    return {
      trend: 'rising',
      label: 'Subindo (+)',
      forecast: 'Tempo firme e melhora nas condições meteorológicas (Anticiclone)',
      color: 'text-blue-600',
    };
  } else if (pressureDelta < -0.8) {
    return {
      trend: 'falling',
      label: 'Caindo (-)',
      forecast: 'Aproximação de instabilidade, nebulosidade ou chuva (Queda barométrica)',
      color: 'text-amber-600',
    };
  } else {
    return {
      trend: 'steady',
      label: 'Estável (~)',
      forecast: 'Manutenção do padrão atmosférico atual',
      color: 'text-slate-600',
    };
  }
}

/**
 * Avalia conforto da umidade relativa
 */
export function getHumidityComfort(humidity: number): {
  level: 'dry' | 'optimal' | 'humid';
  text: string;
  color: string;
} {
  if (humidity < 30) {
    return { level: 'dry', text: 'Ar Seco (Alerta)', color: 'text-amber-600' };
  } else if (humidity <= 60) {
    return { level: 'optimal', text: 'Faixa Ideal', color: 'text-emerald-600' };
  } else {
    return { level: 'humid', text: 'Umidade Elevada', color: 'text-blue-600' };
  }
}
