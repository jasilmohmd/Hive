import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ButtonComponent, ButtonVariant, ButtonSize } from '../common/button/button.component';
import { EmptyStateComponent } from '../common/empty-state/empty-state.component';
import { ErrorAlertComponent } from '../common/error-alert/error-alert.component';
import { LoadingStateComponent } from '../common/loading-state/loading-state.component';

interface Swatch {
  name: string;
  cssVar: string;
  hex: string;
  note: string;
}

interface TypeDirection {
  id: 'a' | 'b' | 'c';
  label: string;
  display: string;
  body: string;
  displayStack: string;
  bodyStack: string;
  googleFonts: string;
  tradeoff: string;
}

@Component({
  selector: 'app-styleguide',
  standalone: true,
  imports: [CommonModule, ButtonComponent, EmptyStateComponent, ErrorAlertComponent, LoadingStateComponent],
  templateUrl: './styleguide.component.html',
})
export class StyleguideComponent implements OnInit {
  /** Both defaults now mirror what the app actually ships, so opening
   *  /styleguide shows the real thing rather than a proposal. */
  ramp: 'warm' | 'neutral' = 'warm';
  typeDirection: TypeDirection['id'] = 'a';

  readonly surfaces: Swatch[] = [
    { name: 'surface-950', cssVar: '--surface-950', hex: '#0C0B09', note: 'App ground' },
    { name: 'surface-900', cssVar: '--surface-900', hex: '#1A1815', note: 'Panels' },
    { name: 'surface-850', cssVar: '--surface-850', hex: '#211E1A', note: 'Hover on a panel' },
    { name: 'surface-800', cssVar: '--surface-800', hex: '#2A2621', note: 'Raised: dropdowns, popovers' },
    { name: 'surface-700', cssVar: '--surface-700', hex: '#3A342C', note: 'Secondary button fill' },
    { name: 'surface-600', cssVar: '--surface-600', hex: '#554D42', note: 'Borders, dividers' },
  ];

  readonly brand: Swatch[] = [
    { name: 'brand', cssVar: '--brand', hex: '#F3C70D', note: 'Primary fill, active state — 10.96:1 on surface-900' },
    { name: 'brand-hover', cssVar: '--brand-hover', hex: '#E0B600', note: 'Hover on filled amber' },
    { name: 'brand-deep', cssVar: '--brand-deep', hex: '#F39B0D', note: 'Auth gradient partner. Not a button colour.' },
  ];

  readonly inks = [
    { cls: 'text-ink', label: 'Message text', name: 'text-ink', hex: '#F5F2EC', ratio: '15.85:1' },
    { cls: 'text-ink-secondary', label: 'Usernames, labels', name: 'text-ink-secondary', hex: '#B8B0A4', ratio: '8.25:1' },
    { cls: 'text-ink-muted', label: 'Timestamps, hints', name: 'text-ink-muted', hex: '#8A8175', ratio: '4.62:1' },
    { cls: 'text-ink-disabled', label: 'Disabled only', name: 'text-ink-disabled', hex: '#5C554C', ratio: 'decorative' },
  ];

  readonly radii = [
    { cls: 'rounded-lg', label: 'rounded-lg · 8px', note: 'Inputs, list rows, small buttons' },
    { cls: 'rounded-xl', label: 'rounded-xl · 12px', note: 'Buttons, cards, message bubbles' },
    { cls: 'rounded-2xl', label: 'rounded-2xl · 16px', note: 'Panels, modals, floating regions' },
    { cls: 'rounded-full', label: 'rounded-full', note: 'Avatars, tab pills, icon buttons' },
  ];

  readonly spacing = [4, 8, 12, 16, 24, 32, 48];

  readonly variants: { id: ButtonVariant; note: string; label: string }[] = [
    { id: 'primary', label: 'Send invite', note: 'One per view. The thing you came to do.' },
    { id: 'secondary', label: 'Cancel', note: 'Neutral fill. This replaces every indigo button.' },
    { id: 'outline', label: 'Join', note: 'New. A prominent action that repeats — Join, on twelve cards.' },
    { id: 'ghost', label: 'Skip', note: 'Tertiary. Menu rows, toolbars, dismiss.' },
    { id: 'danger', label: 'Leave', note: 'Destructive and irreversible only.' },
  ];

  readonly sizes: { id: ButtonSize; label: string; note: string }[] = [
    { id: 'sm', label: 'Small', note: '32px tall · rounded-lg' },
    { id: 'md', label: 'Medium', note: '40px tall · rounded-xl' },
    { id: 'lg', label: 'Large', note: '52px tall · rounded-2xl' },
  ];

  readonly directions: TypeDirection[] = [
    {
      id: 'a',
      label: 'A · Honeycomb',
      display: 'Baloo 2',
      body: 'Nunito Sans',
      displayStack: '"Baloo 2", ui-sans-serif, system-ui, sans-serif',
      bodyStack: '"Nunito Sans", ui-sans-serif, system-ui, sans-serif',
      googleFonts:
        'https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito+Sans:opsz,wght@6..12,400;6..12,600;6..12,700&display=swap',
      tradeoff: 'Warm and rounded, closest to the Figma lockup. The roundness can read young.',
    },
    {
      id: 'b',
      label: 'B · Signal',
      display: 'Archivo',
      body: 'Public Sans',
      displayStack: '"Archivo", ui-sans-serif, system-ui, sans-serif',
      bodyStack: '"Public Sans", ui-sans-serif, system-ui, sans-serif',
      googleFonts:
        'https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800&family=Public+Sans:wght@400;500;600;700&display=swap',
      tradeoff: 'Neutral and product-grade. Safe, but gives Hive no typographic signature.',
    },
    {
      id: 'c',
      label: 'C · Comb',
      display: 'Bricolage Grotesque',
      body: 'Instrument Sans',
      displayStack: '"Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif',
      bodyStack: '"Instrument Sans", ui-sans-serif, system-ui, sans-serif',
      googleFonts:
        'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Instrument+Sans:wght@400;500;600&display=swap',
      tradeoff: 'The most distinctive, and the most likely to date.',
    },
  ];

  private readonly loadedFonts = new Set<string>();

  get activeDirection(): TypeDirection {
    return this.directions.find((d) => d.id === this.typeDirection) ?? this.directions[0];
  }

  ngOnInit(): void {
    this.applyRamp();
    this.applyType();
  }

  setRamp(ramp: 'warm' | 'neutral'): void {
    this.ramp = ramp;
    this.applyRamp();
  }

  setType(id: TypeDirection['id']): void {
    this.typeDirection = id;
    this.applyType();
  }

  /** Reads the resolved channel triplet back out of the DOM so the swatch labels
   *  stay honest when the neutral ramp is active. */
  resolvedHex(cssVar: string, fallback: string): string {
    if (typeof getComputedStyle !== 'function') return fallback;
    const raw = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
    const parts = raw.split(/[\s,]+/).map((n) => Number(n));
    if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return fallback;
    return '#' + parts.slice(0, 3).map((n) => n.toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  private applyRamp(): void {
    document.documentElement.setAttribute('data-ramp', this.ramp);
  }

  private applyType(): void {
    const dir = this.activeDirection;
    if (!this.loadedFonts.has(dir.id)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = dir.googleFonts;
      document.head.appendChild(link);
      this.loadedFonts.add(dir.id);
    }
    document.documentElement.style.setProperty('--font-display', dir.displayStack);
    document.documentElement.style.setProperty('--font-body', dir.bodyStack);
  }
}
