import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Whether the community channel sidebar is collapsed.
 *
 * This lives in a service rather than in the community layout because the
 * control that toggles it sits in the app shell's navigation — the bottom bar
 * on phones, the icon rail on desktop — while the sidebar it controls is inside
 * a routed child. The two are not in a parent/child template relationship, so
 * they share the flag here instead.
 *
 * The choice is persisted: a preference you have to set again on every
 * navigation is worse than not having one. localStorage access is wrapped
 * because it throws outright in some privacy modes.
 */
@Injectable({ providedIn: 'root' })
export class ChannelSidebarService {
  private static readonly STORAGE_KEY = 'hive.channelSidebarCollapsed';

  private readonly collapsedSubject = new BehaviorSubject<boolean>(
    ChannelSidebarService.readStored()
  );

  readonly collapsed$: Observable<boolean> = this.collapsedSubject.asObservable();

  get collapsed(): boolean {
    return this.collapsedSubject.value;
  }

  toggle(): void {
    this.setCollapsed(!this.collapsed);
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
