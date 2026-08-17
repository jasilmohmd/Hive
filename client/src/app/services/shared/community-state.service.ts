import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import ICommunity from '../../models/community';
import { CommunityService } from '../community.service';


@Injectable({
  providedIn: 'root'
})
export class CommunityStateService {
  private communitySubject = new BehaviorSubject<ICommunity | null>(null);
  community$ = this.communitySubject.asObservable();

  constructor(private communityService: CommunityService) {}

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
}
