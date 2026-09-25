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
    // Items are 36px, or 40px where the pointer is a finger (coarse:py-2.5).
    const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    const itemHeight = coarse ? 40 : 36;
    const items = 3 + (this.isMine ? 1 : 0) + (this.isMine && this.canEdit ? 1 : 0);
    const menuHeight = items * itemHeight + 8;
    const pad = 8;
    // The visual viewport excludes an open on-screen keyboard; innerHeight
    // doesn't, and the menu could open underneath it.
    const viewWidth = window.visualViewport?.width ?? window.innerWidth;
    const viewHeight = window.visualViewport?.height ?? window.innerHeight;
    const maxX = viewWidth - menuWidth - pad;
    const maxY = viewHeight - menuHeight - pad;

    this.menuLeft = Math.round(Math.min(Math.max(pad, this.anchorX), Math.max(pad, maxX)));
    this.menuTop = Math.round(Math.min(Math.max(pad, this.anchorY), Math.max(pad, maxY)));
  }
}
