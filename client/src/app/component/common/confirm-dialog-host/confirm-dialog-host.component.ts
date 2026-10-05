import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CommonModalComponent } from '../common-modal/common-modal.component';
import { ConfirmDialogService } from '../../../services/confirm-dialog.service';

/** Renders whatever ConfirmDialogService is currently asking. Mounted once, in AppComponent. */
@Component({
  selector: 'app-confirm-dialog-host',
  standalone: true,
  imports: [CommonModule, CommonModalComponent],
  template: `
    <ng-container *ngIf="dialogs.request$ | async as req">
      <app-common-modal
        [title]="req.title"
        [message]="req.message || ''"
        [confirmText]="req.confirmText || 'Confirm'"
        [cancelText]="req.cancelText || 'Cancel'"
        [variant]="req.variant || 'confirm'"
        (confirmed)="dialogs.settle(true)"
        (cancelled)="dialogs.settle(false)"
      />
    </ng-container>
  `,
})
export class ConfirmDialogHostComponent {
  constructor(readonly dialogs: ConfirmDialogService) {}
}
