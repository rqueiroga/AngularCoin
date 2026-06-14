// representa uma conversão individual salva no histórico
export interface Conversion {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  result: number;
  rate: number;       // taxa usada no momento da conversão
  date: string;       // data formatada para exibição
  timestamp: number;  // timestamp real para ordenação
}

export interface ConversionHistory {
  conversions: Conversion[];
}
