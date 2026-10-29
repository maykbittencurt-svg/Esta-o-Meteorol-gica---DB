import React, { useState } from 'react';
import { Cpu, Copy, Check, Terminal, Layers, ShieldCheck, Sun, Gauge, Zap } from 'lucide-react';
import { StationConfig } from '../types/weather';

interface Esp32CodeModalProps {
  config: StationConfig;
}

export const Esp32CodeModal: React.FC<Esp32CodeModalProps> = ({ config }) => {
  const [copied, setCopied] = useState(false);

  const esp32Code = `/*
 * ====================================================================
 * ESTAÇÃO METEOROLÓGICA IoT - COLÉGIO DOM BOSCO
 * Projeto desenvolvido para a Mostra Científica de Ciências & Tecnologia
 * Microcontrolador: ESP32 NodeMCU-32S (Dual-Core 240MHz)
 * Sensores integrados:
 *   1. BMP280 (Bosch) -> Pressão Atmosférica Barométrica & Temperatura (I2C)
 *   2. S12ADE / GUVA-S12SD -> Radiação Ultravioleta / Índice UV (ADC Analógico)
 *   3. DHT22 (AM2302) -> Umidade Relativa do Ar & Temperatura (Digital 1-Wire)
 * Nuvem IoT: ThingSpeak (MathWorks)
 * ====================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BMP280.h>
#include "DHT.h"

// --------------------------------------------------------------------
// 1. Configurações de Rede Wi-Fi
// --------------------------------------------------------------------
const char* ssid     = "REDE_WIFI_DOM_BOSCO";
const char* password = "SENHA_DO_WIFI";

// --------------------------------------------------------------------
// 2. Parâmetros da Nuvem ThingSpeak
// --------------------------------------------------------------------
const char* thingSpeakServer = "http://api.thingspeak.com";
const char* writeAPIKey      = "${config.writeApiKey || 'XU1PSONID5VM7KS6'}";
const unsigned long channelID = ${config.channelId || '3556879'};

// --------------------------------------------------------------------
// 3. Mapeamento de Pinos da ESP32
// --------------------------------------------------------------------
// Sensor de Pressão BMP280 (Barramento I2C padrão ESP32)
#define I2C_SDA 21         // Pino SDA do BMP280 conectado ao GPIO 21
#define I2C_SCL 22         // Pino SCL do BMP280 conectado ao GPIO 22

// Sensor de Radiação Ultravioleta S12ADE / GUVA-S12SD (Pino Analógico ADC1)
#define PIN_UV_ANALOG 34   // Pino OUT do sensor UV conectado ao GPIO 34 (ADC1)

// Sensor de Umidade DHT22
#define DHTPIN 4           // Pino DATA do DHT22 conectado ao GPIO 4
#define DHTTYPE DHT22      // Sensor DHT22 / AM2302

// --------------------------------------------------------------------
// 4. Objetos e Variáveis Globais
// --------------------------------------------------------------------
DHT dht(DHTPIN, DHTTYPE);
Adafruit_BMP280 bmp; // Sensor barométrico BMP280

// Intervalo de transmissão (mínimo 15s para conta gratuita do ThingSpeak)
const unsigned long postingInterval = 20000; // 20 segundos
unsigned long lastConnectionTime    = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\\n=======================================================");
  Serial.println("  ESTAÇÃO METEOROLÓGICA IoT - COLÉGIO DOM BOSCO");
  Serial.println("  ESP32 + BMP280 (Pressão) + S12ADE (Radiação UV)");
  Serial.println("=======================================================\\n");

  // Configuração do pino analógico do sensor UV S12ADE
  pinMode(PIN_UV_ANALOG, INPUT);
  // Otimiza resolução do conversor analógico-digital (12 bits: 0 a 4095)
  analogReadResolution(12);

  // Inicialização do barramento I2C para o BMP280
  Wire.begin(I2C_SDA, I2C_SCL);
  dht.begin();

  // Inicializa BMP280 no endereço I2C 0x76 (ou 0x77 em alguns módulos)
  if (!bmp.begin(0x76)) {
    Serial.println("Aviso: BMP280 não respondeu em 0x76, tentando endereço 0x77...");
    if (!bmp.begin(0x77)) {
      Serial.println("ERRO CRÍTICO: Sensor BMP280 não detectado! Verifique SDA/SCL.");
    } else {
      Serial.println("Sensor BMP280 conectado com sucesso no endereço 0x77!");
    }
  } else {
    Serial.println("Sensor BMP280 conectado com sucesso no endereço 0x76!");
  }

  // Filtros e sobreamostragem recomendados para medição meteorológica
  bmp.setSampling(Adafruit_BMP280::MODE_NORMAL,     // Modo contínuo
                  Adafruit_BMP280::SAMPLING_X2,     // Sobreamostragem de Temperatura
                  Adafruit_BMP280::SAMPLING_X16,    // Sobreamostragem de Pressão (ultra alta resolução)
                  Adafruit_BMP280::FILTER_X16,      // Filtro IIR contra ruídos de vento/ar
                  Adafruit_BMP280::STANDBY_MS_500); // Standby de 500ms

  // Conexão inicial com a rede Wi-Fi
  connectToWiFi();
}

void loop() {
  // Reconecta ao Wi-Fi automaticamente caso haja oscilação de sinal
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
  }

  // Envia dados periodicamente para a nuvem ThingSpeak
  if (millis() - lastConnectionTime > postingInterval) {
    sendSensorDataToThingSpeak();
    lastConnectionTime = millis();
  }
}

void connectToWiFi() {
  Serial.print("Conectando à rede Wi-Fi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\\nWi-Fi Conectado com sucesso!");
    Serial.print("Endereço IP da ESP32: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\\nFalha temporária ao conectar ao Wi-Fi. Nova tentativa no próximo ciclo.");
  }
}

/**
 * Lê a radiação ultravioleta do sensor S12ADE (fotodiodo de nitreto de gálio)
 * Média de 16 amostras do ADC para supressão de ruídos
 */
float readUvIndexFromS12ADE() {
  long sumMv = 0;
  const int samples = 16;
  for (int i = 0; i < samples; i++) {
    // analogReadMilliVolts lê diretamente a tensão calibrada na ESP32
    sumMv += analogReadMilliVolts(PIN_UV_ANALOG);
    delay(10);
  }
  float avgMv = (float)sumMv / samples;

  // Curva de calibração do sensor S12ADE / GUVA-S12SD:
  // Tensão de saída típica: ~100mV por 1 UVI (Índice de Radiação Ultravioleta)
  // Abaixo de 50mV = sem radiação detectável (Índice 0)
  if (avgMv < 50.0) {
    return 0.0;
  }
  float uvIndex = avgMv / 100.0;
  return uvIndex;
}

/**
 * Coleta todas as leituras físicas e envia para a nuvem ThingSpeak
 */
void sendSensorDataToThingSpeak() {
  // 1. Leitura do Sensor Barométrico BMP280
  float temperatureBMP = bmp.readTemperature();
  float pressureHpa    = bmp.readPressure() / 100.0F; // Converte Pa para hPa

  // 2. Leitura do Sensor de Radiação Ultravioleta S12ADE
  float uvIndex = readUvIndexFromS12ADE();

  // 3. Leitura do Sensor de Umidade DHT22
  float humidity = dht.readHumidity();
  if (isnan(humidity)) {
    Serial.println("Aviso: Falha na leitura do DHT22, usando valor de contingência.");
    humidity = 55.0;
  }

  // Se o sensor de temperatura do BMP280 estiver operando, use-o com prioridade
  float temperature = (!isnan(temperatureBMP) && temperatureBMP > -40) ? temperatureBMP : dht.readTemperature();

  Serial.println("\\n------------------------------------------------");
  Serial.println("  LEITURA METEOROLÓGICA COLETADA");
  Serial.println("------------------------------------------------");
  Serial.printf("Temperatura:         %.2f °C\\n", temperature);
  Serial.printf("Umidade Relativa:    %.2f %%\\n", humidity);
  Serial.printf("Pressão Atmosférica: %.2f hPa (BMP280)\\n", pressureHpa);
  Serial.printf("Radiação UV:         %.2f UVI (S12ADE)\\n", uvIndex);
  Serial.println("------------------------------------------------");

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;

    // Constrói a URL REST para gravar nos 4 campos do ThingSpeak:
    // Field 1: Temperatura (°C)
    // Field 2: Umidade Relativa (%)
    // Field 3: Pressão Barométrica BMP280 (hPa)
    // Field 4: Radiação Ultravioleta S12ADE (UVI)
    String url = String(thingSpeakServer) + "/update?api_key=" + writeAPIKey +
                 "&field1=" + String(temperature, 2) +
                 "&field2=" + String(humidity, 2) +
                 "&field3=" + String(pressureHpa, 2) +
                 "&field4=" + String(uvIndex, 2);

    http.begin(url);
    int httpResponseCode = http.GET();

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.printf("Sucesso! ThingSpeak HTTP Status: %d | Entry ID: %s\\n", httpResponseCode, response.c_str());
    } else {
      Serial.printf("Erro na requisição HTTP ThingSpeak: %s\\n", http.errorToString(httpResponseCode).c_str());
    }
    http.end();
  } else {
    Serial.println("Aviso: ESP32 desconectada do Wi-Fi. Pacote ignorado.");
  }
}
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(esp32Code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Card: Architecture & Sensors Highlight */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-[#002855] rounded-lg">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#002855]">
                Firmware ESP32: Sensor de Pressão BMP280 & Radiação UV S12ADE
              </h2>
              <p className="text-xs text-slate-500">
                Código C++ completo com suporte a I2C, conversão analógica ADC calibrada e nuvem ThingSpeak
              </p>
            </div>
          </div>
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-[#002855] hover:bg-[#07192f] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Código Copiado!' : 'Copiar Código C++'}</span>
          </button>
        </div>

        {/* Hardware Wiring Specs with BMP280 and S12ADE highlighted */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {/* Card 1: BMP280 */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-xs font-bold text-[#002855] uppercase tracking-wider mb-2">
              <Gauge className="w-4 h-4 text-indigo-700" />
              <span>Sensor de Pressão (BMP280)</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-1.5 font-mono">
              <li><strong className="text-slate-900">Protocolo:</strong> I2C (0x76 ou 0x77)</li>
              <li><strong className="text-slate-900">VCC:</strong> 3.3V da ESP32</li>
              <li><strong className="text-slate-900">GND:</strong> GND comum</li>
              <li><strong className="text-slate-900">SDA:</strong> GPIO 21</li>
              <li><strong className="text-slate-900">SCL:</strong> GPIO 22</li>
              <li><strong className="text-slate-900">ThingSpeak:</strong> Field 3 (hPa)</li>
            </ul>
          </div>

          {/* Card 2: S12ADE / GUVA-S12SD UV */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">
              <Sun className="w-4 h-4 text-amber-600" />
              <span>Sensor Radiação UV (S12ADE)</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-1.5 font-mono">
              <li><strong className="text-slate-900">Saída:</strong> Tensão Analógica (mV)</li>
              <li><strong className="text-slate-900">VCC:</strong> 3.3V da ESP32</li>
              <li><strong className="text-slate-900">GND:</strong> GND comum</li>
              <li><strong className="text-slate-900">OUT (Sinal):</strong> GPIO 34 (ADC1)</li>
              <li><strong className="text-slate-900">Resolução:</strong> 12 bits (0-4095)</li>
              <li><strong className="text-slate-900">ThingSpeak:</strong> Field 4 (UVI)</li>
            </ul>
          </div>

          {/* Card 3: DHT22 & Cloud */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              <Layers className="w-4 h-4 text-[#00a896]" />
              <span>DHT22 & Parâmetros Cloud</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-1.5 font-mono">
              <li><strong className="text-slate-900">DHT22 DATA:</strong> GPIO 4 (10k pull-up)</li>
              <li><strong className="text-slate-900">Field 1:</strong> Temperatura (°C)</li>
              <li><strong className="text-slate-900">Field 2:</strong> Umidade (%)</li>
              <li><strong className="text-slate-900">Canal:</strong> #{config.channelId}</li>
              <li><strong className="text-slate-900">Write Key:</strong> {config.writeApiKey}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Code Editor Preview */}
      <div className="bg-[#0b1329] rounded-xl border border-slate-800 overflow-hidden shadow-lg">
        <div className="bg-[#070d1e] px-4 py-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2 font-mono">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-200 font-semibold">
              Estacao_DomBosco_ESP32_BMP280_S12ADE.ino
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">C++ / Arduino IDE 2.x</span>
        </div>
        <pre className="p-5 text-xs text-slate-200 font-mono overflow-x-auto leading-relaxed max-h-[500px]">
          <code>{esp32Code}</code>
        </pre>
      </div>
    </div>
  );
};
