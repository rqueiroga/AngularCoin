import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StorageService } from '../../services/storage.service';
import { Conversion } from '../../models/conversion.model';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss'
})
export class HistoryComponent implements OnInit {
  history: Conversion[] = [];
  confirmClear = false;

  constructor(private storage: StorageService) {}

  ngOnInit(): void { this.load(); }

  load(): void { this.history = this.storage.getHistory(); }

  remove(id: string): void {
    this.storage.removeConversion(id);
    this.load();
  }

  clearAll(): void {
    this.storage.clearHistory();
    this.history = [];
    this.confirmClear = false;
  }

  formatNumber(n: number): string {
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 6 }).format(n);
  }

  formatTime(ts: number): string {
    return new Date(ts).toLocaleString('pt-BR');
  }
}
