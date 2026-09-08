import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CommunityService } from '../../../services/community.service';
import { UserAuthService } from '../../../services/user-auth.service';
import { ToastService } from '../../../services/toast.service';
import ICommunity from '../../../models/community';
import { LoadingStateComponent } from '../../common/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../common/empty-state/empty-state.component';
import { ErrorAlertComponent } from '../../common/error-alert/error-alert.component';

type RequestState = 'idle' | 'pending' | 'sent';

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LoadingStateComponent, EmptyStateComponent, ErrorAlertComponent],
  templateUrl: './discover.component.html',
  styleUrl: './discover.component.css'
})
export class DiscoverComponent implements OnInit {
  /** The full list from the server. */
  allCommunities: ICommunity[] = [];
  /** The filtered view rendered in the template. */
  communities: ICommunity[] = [];
  loading = true;
  errorMessage: string | null = null;

  /** Name search and tag filter, both applied client-side against `allCommunities`. */
  search = '';
  tagFilter = '';

  /** Current user id, resolved once on init; used for membership / pending-request checks. */
  private userId: string | null = null;
  /** Per-community request button state, keyed by community id. */
  requestState: Record<string, RequestState> = {};

  private toast = inject(ToastService);

  constructor(
    private communityService: CommunityService,
    private userAuthService: UserAuthService,
  ) {}

  ngOnInit(): void {
    forkJoin({
      communities: this.communityService.listCommunities(),
      user: this.userAuthService.getUserDetails().pipe(
        map(res => res.userData?._id ?? null),
        catchError(() => of(null)),
      ),
    }).subscribe({
      next: ({ communities, user }) => {
        this.allCommunities = communities ?? [];
        this.userId = user;
        this.applyFilter();
        this.loading = false;
      },
      error: (e: Error) => {
        this.errorMessage = e.message;
        this.loading = false;
      }
    });
  }

  /** Distinct tags across all loaded communities, for the filter dropdown. */
  get tagOptions(): { _id: string; name: string }[] {
    const seen = new Map<string, string>();
    for (const c of this.allCommunities) {
      for (const t of (c.tags || []) as any[]) {
        if (t && t._id && !seen.has(t._id)) seen.set(t._id, t.name || t._id);
      }
    }
    return [...seen].map(([_id, name]) => ({ _id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }

  applyFilter(): void {
    const term = this.search.trim().toLowerCase();
    this.communities = this.allCommunities.filter(c => {
      const matchesName = !term || c.name.toLowerCase().includes(term)
        || (c.description || '').toLowerCase().includes(term);
      const matchesTag = !this.tagFilter
        || ((c.tags || []) as any[]).some(t => (t?._id || t) === this.tagFilter);
      return matchesName && matchesTag;
    });
  }

  clearFilters(): void {
    this.search = '';
    this.tagFilter = '';
    this.applyFilter();
  }

  get hasActiveFilter(): boolean {
    return !!this.search.trim() || !!this.tagFilter;
  }

  private isMember(c: ICommunity): boolean {
    if (!this.userId) return false;
    return (c.members || []).some(m => {
      const id = typeof m.userId === 'string' ? m.userId : m.userId?._id;
      return id === this.userId;
    });
  }

  private hasPendingRequest(c: ICommunity): boolean {
    if (!this.userId) return false;
    return (c.joinRequests || []).map(r => (typeof r === 'string' ? r : (r as any)?._id)).includes(this.userId);
  }

  /** A private community the current user can request to join. */
  canRequestToJoin(c: ICommunity): boolean {
    return c.type === 'private' && !this.isMember(c) && !this.hasPendingRequest(c) && this.requestState[c._id] !== 'sent';
  }

  /** Request already sent (server-side pending, or sent this session). */
  hasSentRequest(c: ICommunity): boolean {
    return c.type === 'private' && !this.isMember(c) && (this.hasPendingRequest(c) || this.requestState[c._id] === 'sent');
  }

  requestButtonLabel(c: ICommunity): string {
    if (this.requestState[c._id] === 'sent' || this.hasPendingRequest(c)) return 'Requested';
    if (this.requestState[c._id] === 'pending') return 'Sending…';
    return 'Request to join';
  }

  requestToJoin(c: ICommunity): void {
    if (this.requestState[c._id] === 'pending' || this.requestState[c._id] === 'sent') return;
    this.requestState[c._id] = 'pending';
    this.communityService.requestToJoinCommunity(c._id).subscribe({
      next: () => {
        this.requestState[c._id] = 'sent';
        this.toast.success(`Request to join ${c.name} sent`);
      },
      error: (err: Error) => {
        this.requestState[c._id] = 'idle';
        this.toast.error(err.message || 'Could not send join request');
      },
    });
  }

  trackCommunity(_index: number, c: ICommunity): string {
    return c._id;
  }
}
