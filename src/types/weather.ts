export interface WeatherReading {
  entry_id: number;
  created_at: string;
  temperature: number; // °C (BMP280 / DHT22)
  humidity: number;    // % (DHT22)
  pressure: number;    // hPa (BMP280)
  uvIndex: number;     // 0 - 15 (S12ADE / GUVA-S12SD)
  uvRawMv?: number;    // Milivolts lidos pelo ADC da ESP32
  heatIndex?: number;  // °C
  dewPoint?: number;   // °C
  altitude?: number;   // m (Cálculo hipsométrico com BMP280)
  seaLevelPressure?: number; // hPa
}

export interface ThingSpeakFeedItem {
  created_at: string;
  entry_id: number;
  field1: string | null; // Temperatura (°C)
  field2: string | null; // Umidade (%)
  field3: string | null; // Pressão Barométrica (BMP280 - hPa)
  field4?: string | null; // Radiação UV / Índice UV (S12ADE)
  field5?: string | null; // Opcional: Tensão analógica UV (mV) ou Altitude
}

export interface ThingSpeakChannelInfo {
  id: number;
  name: string;
  description: string;
  latitude?: string;
  longitude?: string;
  field1?: string;
  field2?: string;
  field3?: string;
  field4?: string;
  field5?: string;
  created_at: string;
  updated_at: string;
  last_entry_id: number;
}

export interface ThingSpeakResponse {
  channel: ThingSpeakChannelInfo;
  feeds: ThingSpeakFeedItem[];
}

export interface StationConfig {
  channelId: string;
  writeApiKey: string;
  readApiKey: string;
  refreshInterval: number; // segundos
  isSimulation: boolean;
  stationName: string;
  locationName: string;
  altitudeCalibration: number; // altitude em metros para calibração QNH (padrão 915m - Curitiba)
}

export type TimeRange = '1h' | '6h' | '24h' | '7d';
export type ActiveTab = 'dashboard' | 'history' | 'science' | 'esp32' | 'kiosk';

export interface UvAssessment {
  index: number;
  level: 'low' | 'moderate' | 'high' | 'very_high' | 'extreme';
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  recommendation: string;
  maxSunExposureMinutes: number; // tempo de exposição seguro estimado
  sunscreenSpf: string;
}
