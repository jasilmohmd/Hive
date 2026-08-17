import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.component.html',
})
export class ButtonComponent {
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() variant: 'primary' | 'secondary' | 'ghost' | 'danger' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() loading = false;
  @Input() disabled = false;
  @Input() block = false;
  @Input() extraClass = '';

  get variantClasses(): string {
    switch (this.variant) {
      case 'primary':
        return 'bg-brand text-surface-950 hover:bg-brand-hover disabled:opacity-50';
      case 'secondary':
        return 'bg-surface-700 text-white hover:bg-surface-600 disabled:opacity-50';
      case 'ghost':
        return 'bg-transparent text-zinc-200 hover:bg-zinc-800 disabled:opacity-50';
      case 'danger':
        return 'bg-danger text-white hover:bg-danger-hover disabled:opacity-50';
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
