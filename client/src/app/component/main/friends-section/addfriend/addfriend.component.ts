import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FriendService } from '../../../../services/friends.service';
import { CommonTableComponent } from '../../../common/common-table/common-table.component';
import { EmptyStateComponent } from '../../../common/empty-state/empty-state.component';
import { LoadingStateComponent } from '../../../common/loading-state/loading-state.component';
import { TableAction, TableColumn } from '../../../../interface/table.interface';
import { ToastService } from '../../../../services/toast.service';
import { Subject, catchError, debounceTime, finalize, map, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-addfriend',
  standalone: true,
  imports: [FormsModule, CommonModule, CommonTableComponent, EmptyStateComponent, LoadingStateComponent],
  templateUrl: './addfriend.component.html',
  styleUrls: ['./addfriend.component.css']
})
export class AddfriendComponent implements OnInit {
  searchTerm: string = '';
  searchResults: any[] = [];
  isLoading: boolean = false;
  hasSearched: boolean = false;

  tableColumns: TableColumn[] = [
    { header: 'Profile', field: 'profilePicture', isImage: true },
    { header: 'Username', field: 'userName' }
  ];

  /** Per-row request state, so a sent request reads "Requested" and can't be re-sent by a second tap. */
  private requestState = new Map<string, 'sending' | 'sent'>();

  primaryActions: TableAction[] = [
    {
      label: 'Send Request',
      labelFor: (row: any) => {
        const state = this.requestState.get(row._id);
        return state === 'sent' ? 'Requested' : state === 'sending' ? 'Sending…' : 'Send Request';
      },
      disabled: (row: any) => this.requestState.has(row._id),
      action: (row: any) => this.sendFriendRequest(row._id),
      class: '!bg-success !text-surface-950 hover:!bg-success-hover px-4 py-2 text-sm rounded-md',
      display: "label"
    }
  ];

  private readonly searchTerms = new Subject<string>();
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);

  constructor(private friendService: FriendService) { }

  ngOnInit(): void {
    // switchMap drops a slower, older response instead of letting it overwrite
    // a newer one; the old distinctUntilChanged also left the spinner running
    // forever when the same term was typed again.
    this.searchTerms.pipe(
      debounceTime(300),
      map((term) => term.trim()),
      switchMap((term) => {
        if (!term) {
          return of({ term, users: [] as any[] });
        }
        return this.friendService.searchUserByUsername(term).pipe(
          map((users) => ({ term, users })),
          catchError(() => {
            this.toast.error('Could not search right now. Please try again.');
            return of({ term, users: [] as any[] });
          })
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(({ term, users }) => {
      this.searchResults = (users ?? []).map((u: any) => ({
        profilePicture: u?.imageUrl ?? u?.profilePicture,
        userName: u.userName,
        _id: u._id,
      }));
      this.hasSearched = !!term;
      this.isLoading = false;
    });
  }

  onSearchTermChange(): void {
    this.isLoading = !!this.searchTerm.trim();
    this.searchTerms.next(this.searchTerm);
  }

  sendFriendRequest(userId: string): void {
    if (this.requestState.has(userId)) return;
    this.requestState.set(userId, 'sending');
    this.friendService.sendFriendRequest(userId)
      .pipe(finalize(() => {
        if (this.requestState.get(userId) === 'sending') this.requestState.delete(userId);
      }))
      .subscribe({
        next: () => {
          this.requestState.set(userId, 'sent');
          this.toast.success('Friend request sent');
        },
        error: (err) => {
          this.toast.error(err?.message || 'Failed to send friend request.');
        }
      });
  }
}
