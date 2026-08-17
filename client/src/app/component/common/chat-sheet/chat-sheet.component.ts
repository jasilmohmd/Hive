import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * Shared chrome for the chat composer's popup panels: a dismiss-on-tap backdrop
 * that renders as a full-screen bottom sheet on mobile and an anchored dropdown
 * from the `sm` breakpoint up.
 *
 * Per-panel sizing/padding differences go through `panelClass`; the surrounding
 * backdrop, positioning, and theme chrome are shared.
 */
@Component({
  selector: 'app-chat-sheet',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-sheet.component.html',
  // `display: contents` keeps this wrapper out of the layout, so each popup's
  // backdrop positions against the same containing block as before extraction.
  host: { class: 'contents' },
})
export class ChatSheetComponent {
  @Input() theme: 'dm' | 'channel' = 'dm';
  /** Extra classes for the panel (max-height, padding, overflow, max-width). */
  @Input() panelClass = '';
  /** When set, renders the standard bordered header with a Close button. */
  @Input() sheetTitle: string | null = null;

  @Output() dismiss = new EventEmitter<void>();

  get themeClasses(): string {
    return this.theme === 'channel'
      ? 'bg-zinc-900 text-zinc-200'
      : 'bg-surface-900 text-zinc-200 ring-1 ring-zinc-800';
  }
}
