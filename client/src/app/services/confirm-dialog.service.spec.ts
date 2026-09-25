import { ConfirmDialogService } from './confirm-dialog.service';

describe('ConfirmDialogService', () => {
  let service: ConfirmDialogService;
  let current: unknown;

  beforeEach(() => {
    service = new ConfirmDialogService();
    service.request$.subscribe((r) => (current = r));
  });

  it('shows the request and resolves with the answer', async () => {
    const answer = service.confirm({ title: 'Leave?' });
    expect((current as { title: string }).title).toBe('Leave?');
    service.settle(true);
    expect(await answer).toBeTrue();
    expect(current).toBeNull();
  });

  it('treats a new request as cancelling the open one', async () => {
    const first = service.confirm({ title: 'First' });
    const second = service.confirm({ title: 'Second' });
    expect(await first).toBeFalse();
    expect((current as { title: string }).title).toBe('Second');
    service.settle(false);
    expect(await second).toBeFalse();
  });

  it('ignores a settle with nothing open', () => {
    expect(() => service.settle(true)).not.toThrow();
  });
});
