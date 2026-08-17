import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
} from '@angular/core';

@Component({
  selector: 'app-chat-message-context-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-message-context-menu.component.html',
})
export class ChatMessageContextMenuComponent implements OnChanges {
  @Input() isMine = false;
  @Input() canEdit = false;
  @Input() anchorX = 0;
  @Input() anchorY = 0;
  @Output() reply = new EventEmitter<void>();
  @Output() react = new EventEmitter<void>();
  @Output() forward = new EventEmitter<void>();
  @Output() edit = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() dismiss = new EventEmitter<void>();

  menuLeft = 0;
  menuTop = 0;

  ngOnChanges(): void {
    this.updatePosition();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.dismiss.emit();
  }

  private updatePosition(): void {
    if (typeof window === 'undefined') return;

    const menuWidth = 168;
    const menuHeight = this.isMine && this.canEdit ? 200 : this.isMine ? 168 : 132;
    const pad = 8;
    const maxX = window.innerWidth - menuWidth - pad;
    const maxY = window.innerHeight - menuHeight - pad;

    this.menuLeft = Math.round(Math.min(Math.max(pad, this.anchorX), Math.max(pad, maxX)));
    this.menuTop = Math.round(Math.min(Math.max(pad, this.anchorY), Math.max(pad, maxY)));
  }
}
