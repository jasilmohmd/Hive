import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { CallService } from '../services/call.service';
import { ConfirmDialogService } from '../services/confirm-dialog.service';

/**
 * A DM call lives on the direct-message page and ends when you leave it. That
 * used to happen silently — tap a community in the nav mid-call and the call
 * was just gone. Ask first. A call that is only ringing (incoming) doesn't
 * count: the incoming-call modal owns that one.
 */
export const confirmLeaveCallGuard: CanDeactivateFn<unknown> = () => {
  const call = inject(CallService);
  const dialogs = inject(ConfirmDialogService);
  const state = call.callState$.value;
  if (state !== 'outgoing' && state !== 'connecting' && state !== 'active') {
    return true;
  }
  return dialogs.confirm({
    title: 'End the call?',
    message: 'Leaving this conversation hangs up the call.',
    confirmText: 'End call',
    cancelText: 'Stay',
    variant: 'destructive',
  });
};
