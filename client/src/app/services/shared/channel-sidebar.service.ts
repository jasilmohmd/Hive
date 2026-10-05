import { Injectable } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

/** Below Tailwind's `md`: the channel list is a slide-over drawer, not a column. */
export const PHONE_QUERY = '(max-width: 767.98px)';

/**
 * State of the community channel sidebar.
 *
 * This lives in a service rather than in the community layout because the
 * control that toggles it sits in the app shell's navigation — the bottom bar
 * on phones, the icon rail on desktop — while the sidebar it controls is inside
 * a routed child. The two are not in a parent/child template relationship, so
 * they share the state here instead.
 *
 * Two independent pieces of state, one per layout:
 *
 * - `collapsed` (md+): the sidebar is a column beside the content and can be
 *   hidden. Persisted: a preference you have to set again on every navigation
 *   is worse than not having one. localStorage access is wrapped because it
 *   throws outright in some privacy modes.
 * - `mobileOpen` (phones): the sidebar is a drawer over the content, closed by
 *   default and after every navigation. Not persisted — a drawer that reopens
 *   itself on the next visit would cover the page you came to read.
 *
 * `toggle()` acts on whichever one the current viewport uses.
 */
@Injectable({ providedIn: 'root' })
export class ChannelSidebarService {
  private static readonly STORAGE_KEY = 'hive.channelSidebarCollapsed';

  private readonly collapsedSubject = new BehaviorSubject<boolean>(
    ChannelSidebarService.readStored()
  );
  private readonly mobileOpenSubject = new BehaviorSubject<boolean>(false);
  private readonly isPhoneSubject: BehaviorSubject<boolean>;

  readonly collapsed$: Observable<boolean> = this.collapsedSubject.asObservable();
  readonly mobileOpen$: Observable<boolean> = this.mobileOpenSubject.asObservable();
  readonly isPhone$: Observable<boolean>;

  constructor(breakpoints: BreakpointObserver) {
    this.isPhoneSubject = new BehaviorSubject(breakpoints.isMatched(PHONE_QUERY));
    breakpoints
      .observe(PHONE_QUERY)
      .pipe(map((s) => s.matches), distinctUntilChanged())
      .subscribe((isPhone) => {
        this.isPhoneSubject.next(isPhone);
        // Rotating to tablet width with the drawer open would otherwise
        // leave it open, invisibly, for the next time you're on a phone.
        if (!isPhone) this.mobileOpenSubject.next(false);
      });
    this.isPhone$ = this.isPhoneSubject.asObservable();
  }

  get collapsed(): boolean {
    return this.collapsedSubject.value;
  }

  get mobileOpen(): boolean {
    return this.mobileOpenSubject.value;
  }

  get isPhone(): boolean {
    return this.isPhoneSubject.value;
  }

  toggle(): void {
    if (this.isPhone) {
      this.mobileOpenSubject.next(!this.mobileOpen);
    } else {
      this.setCollapsed(!this.collapsed);
    }
  }

  closeMobile(): void {
    if (this.mobileOpen) this.mobileOpenSubject.next(false);
  }

  setCollapsed(collapsed: boolean): void {
    if (collapsed === this.collapsed) {
      return;
    }
    this.collapsedSubject.next(collapsed);
    try {
      localStorage.setItem(
        ChannelSidebarService.STORAGE_KEY,
        collapsed ? '1' : '0'
      );
    } catch {
      // Storage unavailable — the toggle still works for this session.
    }
  }

  private static readStored(): boolean {
    try {
      return localStorage.getItem(ChannelSidebarService.STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  }
}
