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

@Component({
  selector: 'app-common-modal',
  standalone: true,
  imports: [CommonModule],
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

  get confirmClasses(): string {
    switch (this.variant) {
      case 'destructive':
        return 'bg-danger text-white hover:bg-danger-hover';
      case 'confirm':
        return 'bg-brand text-surface-950 hover:bg-brand-hover';
      case 'info':
        return 'bg-success text-white hover:bg-success-hover';
      default:
        return 'bg-danger text-white hover:bg-danger-hover';
    }
  }
}
