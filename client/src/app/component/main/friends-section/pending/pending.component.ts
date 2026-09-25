import { Component, OnInit, inject } from '@angular/core';
import { FriendService } from '../../../../services/friends.service';
import { CommonModule } from '@angular/common';
import { TableAction, TableColumn } from '../../../../interface/table.interface';
import { CommonTableComponent } from '../../../common/common-table/common-table.component';
import { EmptyStateComponent } from '../../../common/empty-state/empty-state.component';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { ErrorAlertComponent } from '../../../common/error-alert/error-alert.component';
import { LoadingStateComponent } from '../../../common/loading-state/loading-state.component';
import { ToastService } from '../../../../services/toast.service';

@Component({
  selector: 'app-pending',
  standalone: true,
  imports: [CommonModule, CommonTableComponent, FormsModule, EmptyStateComponent, ErrorAlertComponent, LoadingStateComponent],
  templateUrl: './pending.component.html',
  styleUrl: './pending.component.css'
})
export class PendingComponent implements OnInit {
  pendingRequests: any[] = [];
  filteredRequests: any[] = [];
  searchTerm: string = '';
  hasSearched: boolean = false;
  errorMessage: string = '';
  loading = true;
  /** Requests being accepted/rejected right now: their buttons are disabled so a double tap can't send twice. */
  private busy = new Set<string>();
  private toast = inject(ToastService);

  // Define columns (example: only username)
  tableColumns: TableColumn[] = [
    { header: 'Profile', field: 'profilePicture', isImage: true },
    { header: 'Username', field: 'userName' }
  ];

  // Define primary action: Message button (always visible)
  primaryActions: TableAction[] = [
    {
      label: 'Accept',
      action: (row: any) => this.acceptRequest(row._id),
      disabled: (row: any) => this.busy.has(row._id),
      class: '!bg-success !text-surface-950 hover:!bg-success-hover px-4 py-2 text-sm rounded-md',
      display: "label"
    },
    {
      label: 'Reject',
      action: (row: any) => this.rejectRequest(row._id),
      disabled: (row: any) => this.busy.has(row._id),
      class: '!bg-danger !text-white hover:!bg-danger-hover px-4 py-2 text-sm rounded-md',
      display: "label"
    }
  ];

  constructor(private friendService: FriendService) { }

  ngOnInit(): void {
    this.loadPendingRequests();
  }

  // Fetch pending requests
  loadPendingRequests(): void {
    this.friendService.getPendingRequests().subscribe({
      next: (response: any[] = []) => {
        // Transform the pending request data so that each row has profilePicture, userName, _id
        this.pendingRequests = response.map(req => ({
          profilePicture: req.sender.imageUrl ?? req.sender.profilePicture,
          userName: req.sender.userName,
          _id: req.sender._id,
          sender: req.sender  // preserve original if needed
        }));
        this.searchRequests();
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load pending requests';
        this.loading = false;
      }
    });
  }

  searchRequests(): void {
    const trimmed = this.searchTerm.trim().toLowerCase();
    if (!trimmed) {
      this.filteredRequests = this.pendingRequests;
      return;
    }
    this.filteredRequests = this.pendingRequests.filter(req =>
      req.userName.toLowerCase().includes(trimmed)
    );
  }

  // Accept a friend request
  acceptRequest(senderId: string): void {
    this.respond(senderId, 'accept');
  }

  // Reject a friend request
  rejectRequest(senderId: string): void {
    this.respond(senderId, 'reject');
  }

  private respond(senderId: string, kind: 'accept' | 'reject'): void {
    if (this.busy.has(senderId)) return;
    const name = this.pendingRequests.find((r) => r._id === senderId)?.userName || 'them';
    this.busy.add(senderId);
    const req = kind === 'accept'
      ? this.friendService.acceptRequest(senderId)
      : this.friendService.rejectRequest(senderId);
    req.pipe(finalize(() => this.busy.delete(senderId))).subscribe({
      next: () => {
        this.pendingRequests = this.pendingRequests.filter((r) => r._id !== senderId);
        this.searchRequests();
        this.toast.success(kind === 'accept' ? `You and ${name} are now friends` : 'Request declined');
      },
      error: (error: Error) => {
        this.toast.error(error?.message || (kind === 'accept' ? 'Failed to accept request' : 'Failed to reject request'));
      },
    });
  }
}
