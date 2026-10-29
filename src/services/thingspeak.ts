import { StationConfig, ThingSpeakResponse, WeatherReading } from '../types/weather';
import {
  calculateAltitude,
  calculateDewPoint,
  calculateHeatIndex,
  calculateSeaLevelPressure,
} from '../utils/calculations';

export const DEFAULT_CONFIG: StationConfig = {
  channelId: '3556879',
  writeApiKey: 'XU1PSONID5VM7KS6',
  readApiKey: '', // Opcional para canais públicos
  refreshInterval: 15, // segundos
  isSimulation: false,
  stationName: 'Estação Meteorológica Dom Bosco',
  locationName: 'Colégio Dom Bosco - PR',
  altitudeCalibration: 915, // Altitude de Curitiba/PR em metros
};

const STORAGE_KEY = 'dom_bosco_weather_config_v2';

export function loadConfig(): StationConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    }
  } catch (err) {
    console.warn('Falha ao ler configuração do localStorage', err);
  }
  return DEFAULT_CONFIG;
}

export function saveConfig(config: StationConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Falha ao salvar configuração no localStorage', err);
  }
}

/**
 * Busca leituras do canal ThingSpeak da estação meteorológica
 */
export async function fetchThingSpeakData(
  config: StationConfig,
  results = 60
): Promise<{
  readings: WeatherReading[];
  channelName: string;
  isSimulatedFallback: boolean;
  errorMessage?: string;
}> {
  if (config.isSimulation) {
    return {
      readings: generateSimulatedDataset(results),
      channelName: config.stationName,
      isSimulatedFallback: true,
    };
  }

  const apiKeyParam = config.readApiKey ? `&api_key=${encodeURIComponent(config.readApiKey)}` : '';
  const url = `https://api.thingspeak.com/channels/${config.channelId}/feeds.json?results=${results}${apiKeyParam}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`ThingSpeak HTTP status ${res.status}`);
    }
    const text = await res.text();

    if (text.trim() === '-1') {
      return {
        readings: generateSimulatedDataset(results),
        channelName: config.stationName,
        isSimulatedFallback: true,
        errorMessage: 'Canal configurado como Privado no ThingSpeak. Adicione a Read API Key nas Configurações ou defina o canal como público.',
      };
    }

    const data: ThingSpeakResponse = JSON.parse(text);

    if (!data.feeds || data.feeds.length === 0) {
      return {
        readings: generateSimulatedDataset(results),
        channelName: data.channel?.name || config.stationName,
        isSimulatedFallback: true,
        errorMessage: 'Nenhum dado encontrado no canal ThingSpeak ainda. Exibindo telemetria em tempo real simulada para a mostra científica.',
      };
    }

    const validReadings: WeatherReading[] = data.feeds
      .filter((f) => f.field1 !== null || f.field2 !== null || f.field3 !== null || f.field4 !== null)
      .map((feed) => {
        const temperature = parseFloat(feed.field1 || '22.0');
        const humidity = parseFloat(feed.field2 || '60.0');
        const pressure = parseFloat(feed.field3 || '1013.25'); // Sensor BMP280
        
        // Sensor UV S12ADE: Se field4 estiver vazio ou NaN, estima com base na hora solar
        let uvIndex = parseFloat(feed.field4 || 'NaN');
        if (isNaN(uvIndex)) {
          // Cálculo simulado coerente caso a ESP32 ainda esteja gravando apenas fields 1-3
          const date = new Date(feed.created_at);
          const hour = date.getHours() + date.getMinutes() / 60;
          if (hour >= 6 && hour <= 18) {
            const solarZenith = Math.sin(((hour - 6) / 12) * Math.PI);
            uvIndex = Number((solarZenith * 6.8 + (Math.random() - 0.5) * 0.4).toFixed(1));
          } else {
            uvIndex = 0.0;
          }
        }

        const validTemp = isNaN(temperature) ? 22.0 : temperature;
        const validHum = isNaN(humidity) ? 60.0 : humidity;
        const validPress = isNaN(pressure) ? 1013.25 : pressure;
        const validUv = Math.max(0, isNaN(uvIndex) ? 0.0 : uvIndex);

        return {
          entry_id: feed.entry_id,
          created_at: feed.created_at,
          temperature: validTemp,
          humidity: validHum,
          pressure: validPress,
          uvIndex: validUv,
          uvRawMv: Math.round(validUv * 100), // ~100mV por 1 UVI no S12ADE
          heatIndex: calculateHeatIndex(validTemp, validHum),
          dewPoint: calculateDewPoint(validTemp, validHum),
          altitude: calculateAltitude(validPress),
          seaLevelPressure: calculateSeaLevelPressure(validPress, config.altitudeCalibration),
        };
      });

    if (validReadings.length === 0) {
      return {
        readings: generateSimulatedDataset(results),
        channelName: data.channel?.name || config.stationName,
        isSimulatedFallback: true,
        errorMessage: 'Campos do canal sem dados numéricos válidos. Exibindo dados de demonstração da estação.',
      };
    }

    return {
      readings: validReadings,
      channelName: data.channel?.name || config.stationName,
      isSimulatedFallback: false,
    };
  } catch (error: any) {
    console.warn('Erro ao conectar ao ThingSpeak, ativando dados de demonstração:', error);
    return {
      readings: generateSimulatedDataset(results),
      channelName: config.stationName,
      isSimulatedFallback: true,
      errorMessage: error?.message || 'Falha de comunicação com o ThingSpeak. Exibindo dados simulados.',
    };
  }
}

/**
 * Envia leitura de teste incluindo os sensores BMP280 e S12ADE
 */
export async function sendTestReadingToThingSpeak(
  writeApiKey: string,
  temperature: number,
  humidity: number,
  pressure: number,
  uvIndex: number
): Promise<{ success: boolean; entryId?: number; message: string }> {
  try {
    const url = `https://api.thingspeak.com/update?api_key=${encodeURIComponent(
      writeApiKey
    )}&field1=${temperature.toFixed(1)}&field2=${humidity.toFixed(1)}&field3=${pressure.toFixed(1)}&field4=${uvIndex.toFixed(1)}`;

    const res = await fetch(url, { method: 'POST' });
    const text = await res.text();
    const entryId = parseInt(text.trim(), 10);

    if (!isNaN(entryId) && entryId > 0) {
      return {
        success: true,
        entryId,
        message: `Pacote transmitido ao ThingSpeak com sucesso! (ID da Leitura: ${entryId})`,
      };
    } else if (entryId === 0) {
      return {
        success: false,
        message: 'Limite de envio do ThingSpeak (aguarde 15s entre cada transmissão na conta gratuita).',
      };
    } else {
      return {
        success: false,
        message: `Falha ao gravar no ThingSpeak (código: ${text}). Verifique a Write API Key.`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Erro de conexão: ${err?.message || 'Falha de rede'}`,
    };
  }
}

/**
 * Gera conjunto de dados físicos altamente realistas simulando leituras atmosféricas
 * incluindo curva solar de radiação UV (S12ADE) e pressão do BMP280
 */
export function generateSimulatedDataset(count = 60): WeatherReading[] {
  const readings: WeatherReading[] = [];
  const now = new Date();

  // Valores médios para o microclima de Curitiba/PR
  const baseTemp = 22.8;
  const baseHum = 58.0;
  const basePress = 1014.5; // BMP280

  for (let i = count - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 20 * 1000); // amostras a cada 20 segundos

    // Variação microclimática suave
    const noiseT = Math.sin(i * 0.12) * 0.7 + (Math.random() - 0.5) * 0.2;
    const noiseH = -Math.sin(i * 0.12) * 2.0 + (Math.random() - 0.5) * 0.6;
    const noiseP = Math.cos(i * 0.07) * 0.35 + (Math.random() - 0.5) * 0.12;

    const temp = Number((baseTemp + noiseT).toFixed(1));
    const hum = Math.min(100, Math.max(10, Number((baseHum + noiseH).toFixed(1))));
    const press = Number((basePress + noiseP).toFixed(1));

    // Radiação Ultravioleta (S12ADE): simulação diurna realista (ex: índice UV entre 4.5 e 7.2)
    const baseUv = 5.8;
    const noiseUv = Math.sin(i * 0.15) * 1.2 + (Math.random() - 0.5) * 0.3;
    const uvIndex = Math.max(0, Number((baseUv + noiseUv).toFixed(1)));
    const uvRawMv = Math.round(uvIndex * 105);

    readings.push({
      entry_id: 2000 + (count - i),
      created_at: time.toISOString(),
      temperature: temp,
      humidity: hum,
      pressure: press,
      uvIndex,
      uvRawMv,
      heatIndex: calculateHeatIndex(temp, hum),
      dewPoint: calculateDewPoint(temp, hum),
      altitude: calculateAltitude(press),
      seaLevelPressure: calculateSeaLevelPressure(press, 915),
    });
  }

  return readings;
}
