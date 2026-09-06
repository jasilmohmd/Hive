import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.component.html',
})
export class ButtonComponent {
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() loading = false;
  @Input() disabled = false;
  @Input() block = false;
  @Input() extraClass = '';

  /**
   * Every variant carries a border — transparent where it is not visible — so
   * `outline` matches the others' height exactly instead of sitting 2px taller.
   */
  get variantClasses(): string {
    switch (this.variant) {
      case 'primary':
        return 'border border-transparent bg-brand text-surface-950 hover:bg-brand-hover focus-visible:ring-brand disabled:opacity-50';
      case 'secondary':
        return 'border border-transparent bg-surface-700 text-ink hover:bg-surface-600 focus-visible:ring-brand disabled:opacity-50';
      case 'outline':
        return 'border border-brand bg-transparent text-brand hover:bg-brand hover:text-surface-950 focus-visible:ring-brand disabled:opacity-50';
      case 'ghost':
        return 'border border-transparent bg-transparent text-ink-secondary hover:bg-surface-850 hover:text-ink focus-visible:ring-brand disabled:opacity-50';
      case 'success':
        return 'border border-transparent bg-success text-surface-950 hover:bg-success-hover focus-visible:ring-brand disabled:opacity-50';
      case 'danger':
        return 'border border-transparent bg-danger text-white hover:bg-danger-hover focus-visible:ring-danger-text disabled:opacity-50';
      default:
        return '';
    }
  }

  get sizeClasses(): string {
    switch (this.size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm rounded-lg';
      case 'lg':
        return 'px-6 py-3 text-lg rounded-2xl';
      default:
        return 'px-4 py-2 text-base rounded-xl';
    }
  }
}
