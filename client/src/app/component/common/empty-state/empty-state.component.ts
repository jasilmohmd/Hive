import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empty-state.component.html',
})
export class EmptyStateComponent {
  @Input() title = '';
  @Input() description = '';
  @Input() actionLabel = '';
  @Input() iconSrc = '';
  @Input() iconAlt = '';
  /** Lighter chrome when centered inside a flex content area (e.g. friends empty search). */
  @Input() embedded = false;
  @Output() action = new EventEmitter<void>();

  onAction(): void {
    this.action.emit();
  }
}
