import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-chat-attach-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-attach-menu.component.html',
})
export class ChatAttachMenuComponent {
  @Input() theme: 'dm' | 'channel' = 'dm';
  @Output() mediaRequested = new EventEmitter<void>();
  @Output() documentRequested = new EventEmitter<void>();
  @Output() locationRequested = new EventEmitter<void>();
  @Output() voiceRequested = new EventEmitter<void>();
  @Output() contactRequested = new EventEmitter<void>();
  @Output() pollRequested = new EventEmitter<void>();
  @Output() dismiss = new EventEmitter<void>();

  onBackdropClick(): void {
    this.dismiss.emit();
  }
}
