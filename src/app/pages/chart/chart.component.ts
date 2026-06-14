import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CurrencyService } from '../../services/currency.service';
import { CurrencyInfo } from '../../models/currency.model';
import { Chart, registerables } from 'chart.js';

// precisa registrar todos os componentes do Chart.js antes de usar
Chart.register(...registerables);

interface ChartPoint { date: string; rate: number; }

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.scss'
})
export class ChartComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  currencies: CurrencyInfo[] = [];
  fromCurrency = 'USD';
  toCurrency   = 'BRL';
  days = 30;

  loading = false;
  error   = '';
  isSimulated = false;
  chartInstance: Chart | null = null;
  chartData: ChartPoint[] = [];

  minRate = 0;
  maxRate = 0;
  avgRate = 0;
  changePercent = 0;

  constructor(private currencyService: CurrencyService) {}

  ngOnInit(): void {
    this.currencyService.getCurrencies().subscribe(list => {
      this.currencies = list;
    });
  }

  ngAfterViewInit(): void {
    this.loadChart();
  }

  ngOnDestroy(): void {
    // importante destruir o chart quando o componente sair da tela
    this.chartInstance?.destroy();
  }

  loadChart(): void {
    this.loading    = true;
    this.error      = '';
    this.isSimulated = false;

    this.currencyService.getHistorical(this.fromCurrency, this.toCurrency, this.days).subscribe({
      next: (data) => {
        this.loading     = false;
        this.isSimulated = this.currencyService.isUsingSimulatedHistory;

        // ordeno por data porque a API às vezes retorna fora de ordem
        const points: ChartPoint[] = Object.entries(data.rates)
          .map(([date, rates]) => ({ date, rate: rates[this.toCurrency] }))
          .filter(p => p.rate != null)
          .sort((a, b) => a.date.localeCompare(b.date));

        this.chartData = points;

        const rateValues = points.map(p => p.rate);
        this.minRate = Math.min(...rateValues);
        this.maxRate = Math.max(...rateValues);
        this.avgRate = rateValues.reduce((a, b) => a + b, 0) / rateValues.length;
        this.changePercent = ((rateValues[rateValues.length - 1] - rateValues[0]) / rateValues[0]) * 100;

        this.renderChart(points);
      },
      error: (e) => {
        this.loading = false;
        this.error   = e.message;
      }
    });
  }

  renderChart(points: ChartPoint[]): void {
    this.chartInstance?.destroy();

    const ctx = this.chartCanvas.nativeElement.getContext('2d')!;
    const labels = points.map(p =>
      new Date(p.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    );
    const values = points.map(p => p.rate);

    // gradiente azul que vai sumindo para baixo
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(26,115,232,0.4)');
    gradient.addColorStop(1, 'rgba(26,115,232,0)');

    this.chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: `${this.fromCurrency}/${this.toCurrency}`,
          data: values,
          borderColor: this.isSimulated ? '#ff9800' : '#1a73e8',
          backgroundColor: this.isSimulated
            ? 'rgba(255,152,0,0.15)'
            : gradient,
          borderWidth: 2,
          pointRadius: points.length > 60 ? 0 : 3,
          pointBackgroundColor: this.isSimulated ? '#ff9800' : '#1a73e8',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1a1d2e',
            titleColor: '#8892b0',
            bodyColor: '#e8eaf6',
            borderColor: '#2d3154',
            borderWidth: 1,
            callbacks: {
              label: (ctx) => ` ${(ctx.parsed.y ?? 0).toFixed(4)} ${this.toCurrency}`
            }
          }
        },
        scales: {
          x: {
            ticks: { color: '#8892b0', maxTicksLimit: 8, font: { size: 10 } },
            grid: { color: 'rgba(45,49,84,0.5)' }
          },
          y: {
            ticks: { color: '#8892b0', font: { size: 10 } },
            grid: { color: 'rgba(45,49,84,0.5)' }
          }
        }
      }
    });
  }

  fmt(n: number): string {
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(n);
  }

  fmtPct(n: number): string {
    return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
  }
}
