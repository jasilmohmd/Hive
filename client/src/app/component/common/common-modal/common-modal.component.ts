import { CommonModule } from '@angular/common';

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
  imports: [CommonModule, ButtonComponent],
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

  onBackdropClick(event: MouseEvent): void {
    if (!this.closeOnBackdrop) return;
    if (event.target === event.currentTarget) {
      this.cancel();
    }
  }

  confirm(): void {
    if (this.loading) return;
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
