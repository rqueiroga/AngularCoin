import { Injectable, signal } from '@angular/core';
import { AppSettings } from '../models/currency.model';
import { StorageService } from './storage.service';

// Usei signals do Angular 17 aqui porque achei mais limpo do que BehaviorSubject
// O signal é reativo e qualquer componente que depende dele atualiza automaticamente
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private _settings = signal<AppSettings>(this.storage.getSettings());
  readonly settings = this._settings.asReadonly();

  constructor(private storage: StorageService) {}

  get(): AppSettings {
    return this._settings();
  }

  update(partial: Partial<AppSettings>): void {
    const updated = { ...this._settings(), ...partial };
    this._settings.set(updated);
    this.storage.saveSettings(updated);
  }
}
