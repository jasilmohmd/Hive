import { ChangeDetectorRef, Component, HostListener, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FriendService } from '../../../../services/friends.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommonTableComponent } from '../../../common/common-table/common-table.component';
import { TableAction, TableColumn } from '../../../../interface/table.interface';
import { CommonModalComponent } from '../../../common/common-modal/common-modal.component';
import { finalize } from 'rxjs/operators';
import { ToastService } from '../../../../services/toast.service';
import { EmptyStateComponent } from '../../../common/empty-state/empty-state.component';
import { ErrorAlertComponent } from '../../../common/error-alert/error-alert.component';

@Component({
  selector: 'app-friends',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CommonTableComponent,
    CommonModalComponent,
    EmptyStateComponent,
    ErrorAlertComponent,
  ],
  templateUrl: './friends.component.html',
  styleUrl: './friends.component.css',
})
export class FriendsComponent implements OnInit {
  friends: any[] = [];
  errorMessage = '';
  filteredFriends: any[] = [];
  searchTerm = '';
  hasSearched = false;

  showSearchBar = true;
  private lastScrollTop = 0;

  tableColumns: TableColumn[] = [
    { header: 'Profile', field: 'profilePicture', isImage: true },
    { header: 'Username', field: 'userName' },
  ];

  primaryActions: TableAction[] = [];

  secondaryActions: TableAction[] = [
    {
      label: 'Unfriend',
      action: (row: any) => this.requestConfirmation('unfriend', row._id ?? row.id),
    },
    {
      label: 'Block User',
      action: (row: any) => this.requestConfirmation('block', row._id ?? row.id),
    },
  ];

  confirmModalVisible = false;
  pendingAction: { type: 'unfriend' | 'block'; friendId: string } | null = null;
  confirmLoading = false;

  private toast = inject(ToastService);

  constructor(
    private router: Router,
    private friendsService: FriendService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadFriends();
  }

  loadFriends(): void {
    this.friendsService.getAllFriends().subscribe({
      next: (response) => {
        this.friends = response;
        this.filteredFriends = response;
      },
      error: () => {
        this.errorMessage = 'Failed to load friends list';
      },
    });
  }

  searchFriends(): void {
    const trimmedSearch = this.searchTerm.trim().toLowerCase();
    this.hasSearched = true;

    if (!trimmedSearch) {
      this.filteredFriends = this.friends;
      return;
    }

    this.filteredFriends = this.friends.filter((friend) => friend.userName.toLowerCase().includes(trimmedSearch));
  }

  requestConfirmation(actionType: 'unfriend' | 'block', friendId: string): void {
    this.pendingAction = { type: actionType, friendId };
    this.confirmModalVisible = true;
  }

  handleConfirmation(): void {
    if (!this.pendingAction) return;
    const action = this.pendingAction;
    this.confirmLoading = true;

    const req =
      action.type === 'unfriend'
        ? this.friendsService.unfriendUser(action.friendId)
        : this.friendsService.blockUser(action.friendId);

    req
      .pipe(
        finalize(() => {
          this.confirmLoading = false;
          this.confirmModalVisible = false;
          this.pendingAction = null;
        })
      )
      .subscribe({
        next: () => {
          const id = action.friendId;
          this.filteredFriends = this.filteredFriends.filter((f) => (f._id || f.id) !== id);
          this.friends = this.friends.filter((f) => (f._id || f.id) !== id);
          this.toast.success(action.type === 'unfriend' ? 'Removed from friends' : 'User blocked');
        },
        error: () => {
          this.toast.error('Something went wrong. Try again.');
        },
      });
  }

  cancelConfirmation(): void {
    this.pendingAction = null;
    this.confirmModalVisible = false;
  }

  message(row: any): void {
    const friendId = row._id ?? row.id;
    if (!friendId) return;
    this.router.navigate(['/main/direct_message'], { queryParams: { friendId } });
  }

  @HostListener('window:scroll', [])
  onScroll(): void {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    if (scrollTop > this.lastScrollTop + 10) {
      this.showSearchBar = false;
    } else if (scrollTop < this.lastScrollTop - 10) {
      this.showSearchBar = true;
    }

    this.lastScrollTop = scrollTop;
    this.cdr.detectChanges();
  }
}
