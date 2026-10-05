import { TestBed } from '@angular/core/testing';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { BehaviorSubject } from 'rxjs';
import { ChannelSidebarService } from './channel-sidebar.service';

describe('ChannelSidebarService', () => {
  let phone$: BehaviorSubject<BreakpointState>;

  function create(isPhone: boolean): ChannelSidebarService {
    phone$ = new BehaviorSubject<BreakpointState>({ matches: isPhone, breakpoints: {} });
    TestBed.configureTestingModule({
      providers: [
        {
          provide: BreakpointObserver,
          useValue: { isMatched: () => isPhone, observe: () => phone$ },
        },
      ],
    });
    return TestBed.inject(ChannelSidebarService);
  }

  beforeEach(() => {
    try {
      localStorage.removeItem('hive.channelSidebarCollapsed');
    } catch {
      /* ignore */
    }
  });

  it('on a phone, toggle opens and closes the drawer and leaves the desktop preference alone', () => {
    const svc = create(true);
    expect(svc.mobileOpen).toBeFalse();
    svc.toggle();
    expect(svc.mobileOpen).toBeTrue();
    expect(svc.collapsed).toBeFalse();
    svc.closeMobile();
    expect(svc.mobileOpen).toBeFalse();
  });

  it('on desktop, toggle collapses the column', () => {
    const svc = create(false);
    svc.toggle();
    expect(svc.collapsed).toBeTrue();
    expect(svc.mobileOpen).toBeFalse();
  });

  it('closes the drawer when the viewport grows past the phone breakpoint', () => {
    const svc = create(true);
    svc.toggle();
    phone$.next({ matches: false, breakpoints: {} });
    expect(svc.isPhone).toBeFalse();
    expect(svc.mobileOpen).toBeFalse();
  });
});
