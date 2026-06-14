import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../services/settings.service';
import { StorageService } from '../../services/storage.service';
import { CurrencyService } from '../../services/currency.service';
import { AppSettings, CurrencyInfo } from '../../models/currency.model';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  settings!: AppSettings;
  currencies: CurrencyInfo[] = [];
  savedMsg = '';
  historyCount = 0;

  constructor(
    private settingsService: SettingsService,
    private storage: StorageService,
    private currencyService: CurrencyService
  ) {}

  ngOnInit(): void {
    // clono as settings para não modificar o objeto original antes de salvar
    this.settings = { ...this.settingsService.get() };
    this.historyCount = this.storage.getHistory().length;
    this.currencyService.getCurrencies().subscribe(list => this.currencies = list);
  }

  save(): void {
    this.settingsService.update(this.settings);
    this.savedMsg = 'Configurações salvas!';
    // some a mensagem depois de 2,5 segundos
    setTimeout(() => this.savedMsg = '', 2500);
  }

  clearHistory(): void {
    this.storage.clearHistory();
    this.historyCount = 0;
  }

  get lastUpdatedLabel(): string {
    const ts = this.settings.lastUpdated;
    if (!ts) return 'Nunca';
    return new Date(ts).toLocaleString('pt-BR');
  }

  get cacheSize(): string {
    const bytes = new Blob([localStorage.getItem('angularcoin_rates') ?? '']).size;
    return bytes > 1024 ? (bytes / 1024).toFixed(1) + ' KB' : bytes + ' B';
  }
}
