import { Component, inject } from '@angular/core';
import { FriendService } from '../../../../services/friends.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableAction, TableColumn } from '../../../../interface/table.interface';
import { CommonTableComponent } from '../../../common/common-table/common-table.component';
import { CommonModalComponent } from '../../../common/common-modal/common-modal.component';
import { EmptyStateComponent } from '../../../common/empty-state/empty-state.component';
import { ErrorAlertComponent } from '../../../common/error-alert/error-alert.component';
import { LoadingStateComponent } from '../../../common/loading-state/loading-state.component';
import { ToastService } from '../../../../services/toast.service';

@Component({
  selector: 'app-blocked',
  standalone: true,
  imports: [CommonModule, FormsModule, CommonTableComponent, CommonModalComponent, EmptyStateComponent, ErrorAlertComponent, LoadingStateComponent],
  templateUrl: './blocked.component.html',
  styleUrl: './blocked.component.css'
})
export class BlockedComponent {
  blockedUsers: any[] = [];         // Full list of blocked users
  filteredBlockedUsers: any[] = []; // Filtered list based on search input
  searchTerm: string = '';          // Bound to the search input
  hasSearched: boolean = false;     // Flag to determine if a search was performed
  errorMessage: string = '';
  loading = true;
  private toast = inject(ToastService);

  // Define columns (example: only username)
  tableColumns: TableColumn[] = [
    { header: 'Profile', field: 'profilePicture', isImage: true },
    { header: 'Username', field: 'userName' }
  ];

  // Define primary action: Message button (always visible)
  primaryActions: TableAction[] = [
    {
      label: 'Unblock',
      action: (row: any) => this.requestConfirmation(row._id),
      class: '!bg-surface-600 !text-ink hover:!bg-surface-500 px-4 py-2 text-sm rounded-md',
      display: "label"
    }
  ];

  // For confirmation modal
  confirmModalVisible: boolean = false;
  pendingAction: { friendId: string } | null = null;

  constructor(private friendService: FriendService) { }

  ngOnInit(): void {
    this.loadBlockedUsers();
  }

  // Fetch all blocked users for the current user
  loadBlockedUsers(): void {
    this.loading = true;
    this.friendService.getBlockedUsers().subscribe({
      next: (users) => {
        this.blockedUsers = users ?? [];
        this.filteredBlockedUsers = this.blockedUsers;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = "Failed to load blocked users.";
        this.loading = false;
      }
    });
  }


  // Filter blocked users based on search input
  searchBlockedUsers(): void {
    const trimmedSearch = this.searchTerm.trim().toLowerCase();
    this.hasSearched = true;

    if (!trimmedSearch) {
      this.filteredBlockedUsers = this.blockedUsers;
      return;
    }

    this.filteredBlockedUsers = this.blockedUsers.filter(user =>
      user.userName.toLowerCase().includes(trimmedSearch)
    );
  }

  // Instead of directly calling confirm(), we set the pending action and show the modal.
  requestConfirmation( friendId: string): void {
    this.pendingAction = { friendId };
    this.confirmModalVisible = true;
  }

  // Called when the user confirms the action in the modal.
  handleConfirmation(): void {
    if (!this.pendingAction) return;
    this.unblockUser(this.pendingAction.friendId);
    this.pendingAction = null;
    this.confirmModalVisible = false;
  }

  // Called when the user cancels the confirmation.
  cancelConfirmation(): void {
    this.pendingAction = null;
    this.confirmModalVisible = false;
  }

  // Unblock a user
  unblockUser(blockedUserId: string): void {
      this.friendService.unblockUser(blockedUserId).subscribe({
        next: () => {
          // Remove the unblocked user from both arrays
          this.blockedUsers = this.blockedUsers.filter(user => user._id !== blockedUserId);
          this.filteredBlockedUsers = this.filteredBlockedUsers.filter(user => user._id !== blockedUserId);
          this.toast.success('User unblocked');
        },
        error: () => {
          this.toast.error('Failed to unblock user.');
        }
      });
      
  }
}
