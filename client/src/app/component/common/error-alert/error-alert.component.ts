import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-error-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './error-alert.component.html',
})
export class ErrorAlertComponent {
  @Input() message = '';
  @Input() variant: 'inline' | 'banner' = 'inline';
  @Input() dismissible = false;
  @Input() title = '';
  @Output() dismissed = new EventEmitter<void>();

  dismiss(): void {
    this.dismissed.emit();
  }
}
