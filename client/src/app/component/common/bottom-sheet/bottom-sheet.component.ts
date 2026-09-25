import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';

/**
 * A modal sheet that rises from the bottom of a phone screen and becomes a
 * centred dialog from `sm` up.
 *
 * Unlike `app-chat-sheet` — which anchors to a chat composer and turns into a
 * dropdown on wider screens — this one is free-standing, so it can be opened
 * from app-level navigation. Render it with *ngIf; it handles its own
 * backdrop, Escape, focus hand-off, and the home-indicator inset.
 */
@Component({
  selector: 'app-bottom-sheet',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed inset-0 z-[70] flex items-end justify-center bg-surface-950/60 animate-fade-in sm:items-center sm:p-4"
      (click)="dismiss.emit()"
      role="presentation"
    >
      <div
        #panel
        class="flex max-h-[85dvh] w-full flex-col rounded-t-2xl border border-surface-700 bg-surface-900 text-ink shadow-xl outline-none sm:max-w-md sm:rounded-2xl"
        [ngClass]="panelClass"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="sheetTitle"
        tabindex="-1"
        (click)="$event.stopPropagation()"
      >
        <!-- Grab handle: purely a visual cue that this is a sheet. -->
        <div class="flex justify-center pt-2 sm:hidden" aria-hidden="true">
          <span class="h-1 w-10 rounded-full bg-surface-600"></span>
        </div>
        <div class="flex items-center justify-between gap-2 px-4 pb-2 pt-2 sm:pt-4">
          <h2 class="min-w-0 truncate font-display text-lg font-bold">{{ sheetTitle }}</h2>
          <button
            type="button"
            class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink-secondary hover:bg-surface-850 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand"
            aria-label="Close"
            (click)="dismiss.emit()"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          </button>
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-[calc(0.75rem+var(--safe-bottom))] scrollbar-themed sm:pb-3">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
  host: { class: 'contents' },
})
export class BottomSheetComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) sheetTitle = '';
  @Input() panelClass = '';
  @Output() dismiss = new EventEmitter<void>();

  @ViewChild('panel') private panel?: ElementRef<HTMLElement>;
  private previouslyFocused: HTMLElement | null = null;

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: Event): void {
    event.preventDefault();
    this.dismiss.emit();
  }

  ngAfterViewInit(): void {
    this.previouslyFocused = document.activeElement as HTMLElement | null;
    this.panel?.nativeElement.focus();
  }

  ngOnDestroy(): void {
    this.previouslyFocused?.focus?.();
  }
}
