import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-chat-media-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-media-picker.component.html',
})
export class ChatMediaPickerComponent {
  @Input() theme: 'dm' | 'channel' = 'dm';
  @Output() photoRequested = new EventEmitter<void>();
  @Output() videoRequested = new EventEmitter<void>();
  @Output() dismiss = new EventEmitter<void>();

  onBackdropClick(): void {
    this.dismiss.emit();
  }
}
