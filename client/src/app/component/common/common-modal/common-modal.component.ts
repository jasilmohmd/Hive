import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonComponent, ButtonVariant } from '../button/button.component';
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

@Component({
  selector: 'app-common-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './common-modal.component.html',
  styleUrl: './common-modal.component.css',
})
export class CommonModalComponent implements AfterViewInit, OnDestroy {
  @Input() title = '';
  @Input() message = '';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Input() variant: 'destructive' | 'confirm' | 'info' = 'destructive';
  @Input() loading = false;
  @Input() closeOnBackdrop = true;
  @Input() closeOnEscape = true;
  /** When set, the user must type this exact phrase before confirm is enabled. */
  @Input() confirmPhrase = '';

  typed = '';

  get confirmDisabled(): boolean {
    return this.loading || (!!this.confirmPhrase && this.typed !== this.confirmPhrase);
  }

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  @ViewChild('panel') panel?: ElementRef<HTMLElement>;

  readonly titleId = `modal-title-${Math.random().toString(36).slice(2, 9)}`;
  readonly messageId = `modal-msg-${Math.random().toString(36).slice(2, 9)}`;

  private previouslyFocused: HTMLElement | null = null;

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (!this.closeOnEscape || event.key !== 'Escape') return;
    event.preventDefault();
    this.cancel();
  }

  ngAfterViewInit(): void {
    this.previouslyFocused = document.activeElement as HTMLElement | null;
    queueMicrotask(() => this.focusInitial());
  }

  ngOnDestroy(): void {
    if (this.previouslyFocused?.focus) {
      try {
        this.previouslyFocused.focus();
      } catch {
        /* ignore */
      }
    }
  }

  private focusInitial(): void {
    const root = this.panel?.nativeElement;
    if (!root) return;
    const focusable = root.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus();
  }

  /**
   * Keys pressed inside the panel stay inside it — so shortcuts on the page
   * underneath (the chat composer's Enter, say) don't fire — with two
   * exceptions handled here. Escape cancels: it used to be swallowed by this
   * very stopPropagation before the document listener could see it, so the
   * modal never closed on Escape once focus was inside. Tab wraps between the
   * first and last controls, so focus can't wander onto the page behind.
   */
  onPanelKeydown(event: KeyboardEvent): void {
    event.stopPropagation();
    if (event.key === 'Escape') {
      if (this.closeOnEscape) {
        event.preventDefault();
        this.cancel();
      }
      return;
    }
    if (event.key === 'Tab') {
      this.trapTab(event);
    }
  }

  private trapTab(event: KeyboardEvent): void {
    const root = this.panel?.nativeElement;
    if (!root) return;
    const focusable = Array.from(
      root.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (!this.closeOnBackdrop) return;
    if (event.target === event.currentTarget) {
      this.cancel();
    }
  }

  confirm(): void {
    if (this.confirmDisabled) return;
    this.confirmed.emit();
  }

  cancel(): void {
    if (this.loading) return;
    this.cancelled.emit();
  }

  /** The modal's variant, mapped onto the shared button's own variants. */
  get confirmVariant(): ButtonVariant {
    switch (this.variant) {
      case 'confirm':
        return 'primary';
      case 'info':
        return 'success';
      default:
        return 'danger';
    }
  }
}
