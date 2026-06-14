import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ExchangeRates, CurrencyInfo, HistoricalRates } from '../models/currency.model';
import { StorageService } from './storage.service';

// API principal — gratuita, sem chave, suporta dados históricos
const FRANKFURTER = 'https://api.frankfurter.app';
// API de fallback para taxas atuais
const FALLBACK = 'https://open.er-api.com/v6/latest';

// nomes das moedas para usar quando o endpoint /currencies não responder
const CURRENCY_NAMES: Record<string, string> = {
  USD: 'United States Dollar', EUR: 'Euro', BRL: 'Brazilian Real',
  GBP: 'British Pound', JPY: 'Japanese Yen', CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar', CHF: 'Swiss Franc', CNY: 'Chinese Yuan',
  ARS: 'Argentine Peso', MXN: 'Mexican Peso', CLP: 'Chilean Peso',
  COP: 'Colombian Peso', INR: 'Indian Rupee', KRW: 'South Korean Won',
  SGD: 'Singapore Dollar', HKD: 'Hong Kong Dollar', NOK: 'Norwegian Krone',
  SEK: 'Swedish Krona', DKK: 'Danish Krone', NZD: 'New Zealand Dollar',
  ZAR: 'South African Rand', TRY: 'Turkish Lira', PLN: 'Polish Zloty',
  THB: 'Thai Baht', IDR: 'Indonesian Rupiah', HUF: 'Hungarian Forint',
  CZK: 'Czech Koruna', ILS: 'Israeli Shekel', PHP: 'Philippine Peso',
  MYR: 'Malaysian Ringgit', RON: 'Romanian Leu',
};

@Injectable({ providedIn: 'root' })
export class CurrencyService {
  private currencyNames: Record<string, string> = { ...CURRENCY_NAMES };
  isUsingSimulatedHistory = false;

  constructor(private http: HttpClient, private storage: StorageService) {}

  getCurrencies(): Observable<CurrencyInfo[]> {
    return this.http.get<Record<string, string>>(`${FRANKFURTER}/currencies`).pipe(
      map(data => {
        this.currencyNames = data;
        return Object.entries(data).map(([code, name]) => ({ code, name }));
      }),
      catchError(() =>
        of(Object.entries(CURRENCY_NAMES).map(([code, name]) => ({ code, name })))
      )
    );
  }

  getCurrencyName(code: string): string {
    return this.currencyNames[code] || code;
  }

  getRates(base: string): Observable<ExchangeRates> {
    const settings    = this.storage.getSettings();
    const shouldFetch = this.storage.shouldRefresh(settings.updateFrequency);
    const cached      = this.storage.getCachedRates();

    if (!shouldFetch && cached && cached.base === base) {
      return of(cached);
    }

    if (!navigator.onLine) {
      if (cached) return of(cached);
      return throwError(() => new Error('Sem conexão e sem dados em cache.'));
    }

    // tenta Frankfurter; se falhar, tenta open.er-api.com
    return this.http.get<ExchangeRates>(`${FRANKFURTER}/latest?from=${base}`).pipe(
      tap(rates => this.storage.saveCachedRates(rates)),
      catchError(() =>
        this.http.get<any>(`${FALLBACK}/${base}`).pipe(
          map((r: any) => ({
            base: r.base_code as string,
            date: new Date().toISOString().split('T')[0],
            rates: r.rates as Record<string, number>
          })),
          tap(rates => this.storage.saveCachedRates(rates)),
          catchError(() => {
            if (cached) return of(cached);
            return throwError(() => new Error('Não foi possível obter as taxas. Verifique sua conexão.'));
          })
        )
      )
    );
  }

  convert(amount: number, fromRate: number, toRate: number): number {
    return (amount / fromRate) * toRate;
  }

  // tenta buscar dados históricos reais; se falhar, gera dados simulados
  // baseados na taxa atual com variações realistas para o gráfico não ficar vazio
  getHistorical(from: string, to: string, days: number = 30): Observable<HistoricalRates> {
    const end   = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    const url = `${FRANKFURTER}/${fmt(start)}..${fmt(end)}?from=${from}&to=${to}`;

    return this.http.get<HistoricalRates>(url).pipe(
      tap(() => this.isUsingSimulatedHistory = false),
      catchError(() => {
        // API histórica indisponível — gera série temporal simulada
        // usando a taxa atual como referência
        this.isUsingSimulatedHistory = true;
        return of(this.generateSimulatedHistory(from, to, days));
      })
    );
  }

  // gera dados históricos verossímeis quando a API não está disponível
  private generateSimulatedHistory(from: string, to: string, days: number): HistoricalRates {
    const cached = this.storage.getCachedRates();

    // taxa base: pega do cache ou usa 1 como fallback
    let baseRate = 1;
    if (cached?.rates[to]) {
      baseRate = cached.rates[to];
    } else if (cached?.base === to) {
      baseRate = 1;
    }

    const rates: Record<string, Record<string, number>> = {};
    const end = new Date();

    // gera uma curva com leve tendência + ruído aleatório seed-ado pelo par de moedas
    // usando seed garante que a curva seja sempre igual para o mesmo par
    const seed = (from + to).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    let noise = seed % 100 / 1000; // ruído inicial determinístico

    for (let i = days; i >= 0; i--) {
      const date = new Date(end);
      date.setDate(end.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // caminhada aleatória leve (±0.3% por dia)
      noise += (Math.sin(i * seed) * 0.003);
      const dayRate = baseRate * (1 + noise + Math.sin(i / 7) * 0.01);

      rates[dateStr] = { [to]: parseFloat(dayRate.toFixed(6)) };
    }

    const dateKeys = Object.keys(rates).sort();
    return {
      base: from,
      start_date: dateKeys[0],
      end_date: dateKeys[dateKeys.length - 1],
      rates
    };
  }
}
