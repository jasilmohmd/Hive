import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { confirmLeaveCallGuard } from './leave-call.guard';
import { CallService, CallState } from '../services/call.service';
import { ConfirmDialogService } from '../services/confirm-dialog.service';

describe('confirmLeaveCallGuard', () => {
  let state$: BehaviorSubject<CallState>;
  let dialogs: jasmine.SpyObj<ConfirmDialogService>;

  const run = () =>
    TestBed.runInInjectionContext(() =>
      confirmLeaveCallGuard(
        {},
        {} as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
        {} as RouterStateSnapshot
      )
    );

  beforeEach(() => {
    state$ = new BehaviorSubject<CallState>('idle');
    dialogs = jasmine.createSpyObj<ConfirmDialogService>('ConfirmDialogService', ['confirm']);
    TestBed.configureTestingModule({
      providers: [
        { provide: CallService, useValue: { callState$: state$ } },
        { provide: ConfirmDialogService, useValue: dialogs },
      ],
    });
  });

  it('lets you leave when there is no call', () => {
    expect(run()).toBeTrue();
    expect(dialogs.confirm).not.toHaveBeenCalled();
  });

  it('does not ask about a call that is only ringing', () => {
    state$.next('incoming');
    expect(run()).toBeTrue();
  });

  it('asks before leaving an active call, and respects the answer', async () => {
    state$.next('active');
    dialogs.confirm.and.returnValue(Promise.resolve(false));
    expect(await run()).toBeFalse();
    expect(dialogs.confirm).toHaveBeenCalled();
  });
});
