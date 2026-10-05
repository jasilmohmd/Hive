import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ConfirmDialogOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  /** Maps onto app-common-modal's variant: red confirm, brand confirm, or green. */
  variant?: 'destructive' | 'confirm' | 'info';
}

export interface ConfirmDialogRequest extends ConfirmDialogOptions {
  resolve: (confirmed: boolean) => void;
}

/**
 * An awaitable confirm dialog, rendered once at the app root
 * (ConfirmDialogHostComponent) with the same app-common-modal every other
 * confirmation uses.
 *
 * For flows that need a yes/no *answer* rather than a template-owned modal —
 * route guards, service-level "you're about to leave the voice room" checks —
 * and to replace native window.confirm(), which ignores the app's styling and
 * blocks the page.
 *
 * Only one dialog shows at a time; asking again while one is open settles the
 * first as cancelled.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly requestSubject = new BehaviorSubject<ConfirmDialogRequest | null>(null);
  readonly request$ = this.requestSubject.asObservable();

  confirm(options: ConfirmDialogOptions): Promise<boolean> {
    this.settle(false);
    return new Promise<boolean>((resolve) => {
      this.requestSubject.next({ ...options, resolve });
    });
  }

  /** Called by the host when the user answers (or dismisses). */
  settle(confirmed: boolean): void {
    const current = this.requestSubject.value;
    if (!current) return;
    this.requestSubject.next(null);
    current.resolve(confirmed);
  }
}
