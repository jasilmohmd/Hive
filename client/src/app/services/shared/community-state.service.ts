import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import ICommunity from '../../models/community';
import { CommunityService } from '../community.service';


@Injectable({
  providedIn: 'root'
})
export class CommunityStateService {
  private communitySubject = new BehaviorSubject<ICommunity | null>(null);
  community$ = this.communitySubject.asObservable();

  private membershipChangedSubject = new Subject<void>();
  /** Emits when the current user joins/leaves/is removed from a community, so the sidebar list can refresh. */
  membershipChanged$ = this.membershipChangedSubject.asObservable();

  constructor(private communityService: CommunityService) {}

  /** Signal that the current user's community membership changed. */
  notifyMembershipChanged(): void {
    this.membershipChangedSubject.next();
  }

  loadCommunity(id: string, forceRefresh: boolean = false ): Observable<ICommunity | null> {
    if (!forceRefresh && this.communitySubject.value?._id === id) {
      return this.community$; // Return cached value if already loaded
    }

    return this.communityService.getCommunityById(id).pipe(
      tap(community => this.communitySubject.next(community)),
      catchError(error => {
        console.error('Failed to load community', error);
        return of(null);
      })
    );
  }

  /** Drop the cached community so the next load re-fetches (e.g. on logout). */
  clear(): void {
    this.communitySubject.next(null);
  }
}
