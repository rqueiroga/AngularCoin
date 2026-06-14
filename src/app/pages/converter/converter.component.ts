import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CurrencyService } from '../../services/currency.service';
import { StorageService } from '../../services/storage.service';
import { SettingsService } from '../../services/settings.service';
import { CurrencyInfo, ExchangeRates } from '../../models/currency.model';
import { Conversion } from '../../models/conversion.model';

@Component({
  selector: 'app-converter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './converter.component.html',
  styleUrl: './converter.component.scss'
})
export class ConverterComponent implements OnInit {
  currencies: CurrencyInfo[] = [];
  filteredFrom: CurrencyInfo[] = [];
  filteredTo: CurrencyInfo[] = [];

  fromCurrency = 'USD';
  toCurrency   = 'BRL';
  amount       = 1;
  result: number | null = null;
  rate: number | null   = null;

  // controle dos dropdowns de busca
  searchFrom = '';
  searchTo   = '';
  showFromDropdown = false;
  showToDropdown   = false;

  loading   = false;
  error     = '';
  lastUpdated = '';
  isOffline = !navigator.onLine;

  private rates: ExchangeRates | null = null;

  constructor(
    private currencyService: CurrencyService,
    private storage: StorageService,
    private settings: SettingsService
  ) {}

  ngOnInit(): void {
    // carrega as moedas padrão que o usuário configurou
    const s = this.settings.get();
    this.fromCurrency = s.defaultFrom;
    this.toCurrency   = s.defaultTo;

    // monitora conexão para mostrar o banner offline
    window.addEventListener('online',  () => this.isOffline = false);
    window.addEventListener('offline', () => this.isOffline = true);

    this.currencyService.getCurrencies().subscribe(list => {
      this.currencies   = list;
      this.filteredFrom = list;
      this.filteredTo   = list;
      this.loadRates();
    });
  }

  loadRates(): void {
    this.loading = true;
    this.error   = '';
    this.currencyService.getRates(this.fromCurrency).subscribe({
      next: (r) => {
        this.rates  = r;
        this.loading = false;
        this.lastUpdated = new Date().toLocaleTimeString('pt-BR');
        if (this.amount) this.doConvert();
      },
      error: (e) => {
        this.loading = false;
        this.error   = e.message;
      }
    });
  }

  doConvert(): void {
    if (!this.rates || !this.amount) { this.result = null; return; }

    // a lógica aqui é: divido pelo rate da moeda origem para chegar em USD,
    // depois multiplico pelo rate da moeda destino
    // como a API retorna tudo relativo à moeda base, quando a moeda é a própria base o rate é 1
    const rateFrom = this.fromCurrency === this.rates.base ? 1 : this.rates.rates[this.fromCurrency];
    const rateTo   = this.toCurrency   === this.rates.base ? 1 : this.rates.rates[this.toCurrency];

    if (!rateFrom || !rateTo) {
      this.error = 'Taxa não encontrada para a moeda selecionada.';
      return;
    }

    this.rate   = rateTo / rateFrom;
    this.result = this.amount * this.rate;
    this.error  = '';

    // salva no histórico automaticamente a cada conversão
    const conv: Conversion = {
      id: Date.now().toString(),
      fromCurrency: this.fromCurrency,
      toCurrency: this.toCurrency,
      amount: this.amount,
      result: this.result,
      rate: this.rate,
      date: new Date().toLocaleDateString('pt-BR'),
      timestamp: Date.now()
    };
    this.storage.addConversion(conv);
  }

  swapCurrencies(): void {
    [this.fromCurrency, this.toCurrency] = [this.toCurrency, this.fromCurrency];
    this.loadRates();
  }

  onFromChange(): void   { this.loadRates(); }
  onToChange(): void     { if (this.rates) this.doConvert(); }
  onAmountChange(): void { if (this.rates) this.doConvert(); }

  filterFrom(q: string): void {
    this.searchFrom   = q;
    this.filteredFrom = this.currencies.filter(c =>
      c.code.toLowerCase().includes(q.toLowerCase()) ||
      c.name.toLowerCase().includes(q.toLowerCase())
    );
  }

  filterTo(q: string): void {
    this.searchTo   = q;
    this.filteredTo = this.currencies.filter(c =>
      c.code.toLowerCase().includes(q.toLowerCase()) ||
      c.name.toLowerCase().includes(q.toLowerCase())
    );
  }

  selectFrom(code: string): void {
    this.fromCurrency     = code;
    this.searchFrom       = '';
    this.filteredFrom     = this.currencies;
    this.showFromDropdown = false;
    this.loadRates();
  }

  selectTo(code: string): void {
    this.toCurrency     = code;
    this.searchTo       = '';
    this.filteredTo     = this.currencies;
    this.showToDropdown = false;
    if (this.rates) this.doConvert();
  }

  // pequeno delay para o clique no item do dropdown registrar antes de fechar
  closeDropdowns(): void {
    setTimeout(() => { this.showFromDropdown = false; this.showToDropdown = false; }, 200);
  }

  get safeRate(): number { return this.rate ?? 0; }

  formatNumber(n: number): string {
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 6 }).format(n);
  }
}
