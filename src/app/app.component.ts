import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="app-shell">
      <header class="top-bar">
        <div class="logo">
          <span class="logo-icon">₿</span>
          <span class="logo-text">AngularCoin</span>
        </div>

        <!-- navegação horizontal para desktop -->
        <nav class="desktop-nav">
          <a routerLink="/converter" routerLinkActive="active">
            <span class="material-icons">currency_exchange</span> Converter
          </a>
          <a routerLink="/history" routerLinkActive="active">
            <span class="material-icons">history</span> Histórico
          </a>
          <a routerLink="/chart" routerLinkActive="active">
            <span class="material-icons">show_chart</span> Gráfico
          </a>
          <a routerLink="/settings" routerLinkActive="active">
            <span class="material-icons">settings</span> Configurações
          </a>
        </nav>

        <div class="status-indicator">
          <span class="status-dot" [class.online]="isOnline"></span>
          <span class="status-label">{{ isOnline ? 'Online' : 'Offline' }}</span>
        </div>
      </header>

      <main class="main-content">
        <router-outlet />
      </main>

      <!-- navegação inferior só aparece no mobile -->
      <nav class="bottom-nav">
        <a routerLink="/converter" routerLinkActive="active" class="nav-item">
          <span class="material-icons">currency_exchange</span>
          <span>Converter</span>
        </a>
        <a routerLink="/history" routerLinkActive="active" class="nav-item">
          <span class="material-icons">history</span>
          <span>Histórico</span>
        </a>
        <a routerLink="/chart" routerLinkActive="active" class="nav-item">
          <span class="material-icons">show_chart</span>
          <span>Gráfico</span>
        </a>
        <a routerLink="/settings" routerLinkActive="active" class="nav-item">
          <span class="material-icons">settings</span>
          <span>Config</span>
        </a>
      </nav>
    </div>
  `,
  styles: [`
    .app-shell {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: var(--bg);
    }

    /* ── Header ── */
    .top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 32px;
      background: var(--bg-card);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .logo-icon {
      font-size: 24px;
      background: linear-gradient(135deg, var(--primary), var(--accent));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-weight: 900;
    }
    .logo-text {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }

    /* ── Desktop nav ── */
    .desktop-nav {
      display: none;
      gap: 4px;

      a {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        text-decoration: none;
        color: var(--text-muted);
        font-size: 14px;
        font-weight: 500;
        border-radius: 8px;
        transition: all 0.2s;
        .material-icons { font-size: 18px; }
        &:hover { background: var(--bg-input); color: var(--text); }
        &.active { background: rgba(26,115,232,.15); color: var(--primary); }
      }
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--text-muted);
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--danger);
      &.online { background: var(--success); box-shadow: 0 0 5px var(--success); }
    }
    .status-label { display: none; }

    /* ── Main content ── */
    .main-content {
      flex: 1;
      overflow-y: auto;
    }

    /* ── Mobile bottom nav ── */
    .bottom-nav {
      display: flex;
      background: var(--bg-card);
      border-top: 1px solid var(--border);
      position: sticky;
      bottom: 0;
      z-index: 100;
    }
    .nav-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      padding: 10px 4px;
      text-decoration: none;
      color: var(--text-muted);
      font-size: 10px;
      font-weight: 500;
      transition: color 0.2s;
      .material-icons { font-size: 22px; }
      &.active { color: var(--primary); }
    }

    /* ── Desktop breakpoint ── */
    @media (min-width: 768px) {
      .desktop-nav { display: flex; }
      .bottom-nav { display: none; }
      .status-label { display: inline; }
      .main-content { padding: 0; }
    }
  `]
})
export class AppComponent {
  isOnline = navigator.onLine;

  constructor() {
    window.addEventListener('online',  () => this.isOnline = true);
    window.addEventListener('offline', () => this.isOnline = false);
  }
}
