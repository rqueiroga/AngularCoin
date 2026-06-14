// resposta da API para taxas atuais
export interface ExchangeRates {
  base: string;
  date: string;
  rates: Record<string, number>;
}

// item da lista de moedas
export interface CurrencyInfo {
  code: string;
  name: string;
}

// resposta da API para dados históricos (usado no gráfico)
export interface HistoricalRates {
  base: string;
  start_date: string;
  end_date: string;
  rates: Record<string, Record<string, number>>;
}

// configurações salvas pelo usuário
export interface AppSettings {
  updateFrequency: 'always' | 'hourly' | 'daily';
  defaultFrom: string;
  defaultTo: string;
  lastUpdated: number;
  cachedRates: ExchangeRates | null;
  theme: 'dark' | 'light';
}
