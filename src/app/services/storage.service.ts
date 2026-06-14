import { Injectable } from '@angular/core';
import { Conversion } from '../models/conversion.model';
import { AppSettings, ExchangeRates } from '../models/currency.model';

// chaves que uso para organizar os dados no LocalStorage
const KEYS = {
  HISTORY: 'angularcoin_history',
  SETTINGS: 'angularcoin_settings',
  CACHED_RATES: 'angularcoin_rates'
};

const DEFAULT_SETTINGS: AppSettings = {
  updateFrequency: 'always',
  defaultFrom: 'USD',
  defaultTo: 'BRL',
  lastUpdated: 0,
  cachedRates: null,
  theme: 'dark'
};

@Injectable({ providedIn: 'root' })
export class StorageService {

  // --- Histórico ---

  getHistory(): Conversion[] {
    try {
      const raw = localStorage.getItem(KEYS.HISTORY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  addConversion(conv: Conversion): void {
    const history = this.getHistory();
    history.unshift(conv); // mais recente primeiro
    // limito em 100 entradas para não ocupar espaço demais
    const trimmed = history.slice(0, 100);
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(trimmed));
  }

  clearHistory(): void {
    localStorage.removeItem(KEYS.HISTORY);
  }

  removeConversion(id: string): void {
    const history = this.getHistory().filter(c => c.id !== id);
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
  }

  // --- Configurações ---

  getSettings(): AppSettings {
    try {
      const raw = localStorage.getItem(KEYS.SETTINGS);
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  saveSettings(settings: Partial<AppSettings>): void {
    const current = this.getSettings();
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify({ ...current, ...settings }));
  }

  // --- Cache de taxas (para modo offline) ---

  getCachedRates(): ExchangeRates | null {
    try {
      const raw = localStorage.getItem(KEYS.CACHED_RATES);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  saveCachedRates(rates: ExchangeRates): void {
    localStorage.setItem(KEYS.CACHED_RATES, JSON.stringify(rates));
    this.saveSettings({ lastUpdated: Date.now(), cachedRates: rates });
  }

  // verifica se precisa buscar taxas novas com base na frequência configurada
  shouldRefresh(frequency: AppSettings['updateFrequency']): boolean {
    const settings = this.getSettings();
    if (!settings.lastUpdated) return true;
    const elapsed = Date.now() - settings.lastUpdated;
    if (frequency === 'always')  return true;
    if (frequency === 'hourly')  return elapsed > 3_600_000;  // 1 hora em ms
    if (frequency === 'daily')   return elapsed > 86_400_000; // 24 horas em ms
    return true;
  }
}
