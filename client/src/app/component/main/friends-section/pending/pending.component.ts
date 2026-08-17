import { Component, OnInit } from '@angular/core';
import { FriendService } from '../../../../services/friends.service';
import { CommonModule } from '@angular/common';
import { TableAction, TableColumn } from '../../../../interface/table.interface';
import { CommonTableComponent } from '../../../common/common-table/common-table.component';
import { EmptyStateComponent } from '../../../common/empty-state/empty-state.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pending',
  standalone: true,
  imports: [CommonModule, CommonTableComponent, FormsModule, EmptyStateComponent],
  templateUrl: './pending.component.html',
  styleUrl: './pending.component.css'
})
export class PendingComponent implements OnInit {
  pendingRequests: any[] = [];
  filteredRequests: any[] = [];
  searchTerm: string = '';
  hasSearched: boolean = false;
  errorMessage: string = '';

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
      class: '!bg-green-500 hover:!bg-green-600 px-4 py-2 text-sm rounded-md',
      display: "label"
    },
    {
      label: 'Reject',
      action: (row: any) => this.rejectRequest(row._id),
      class: '!bg-red-500 hover:!bg-red-600 px-4 py-2 text-sm rounded-md',
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
      next: (response: any[]) => {
        // Transform the pending request data so that each row has profilePicture, userName, _id
        this.pendingRequests = response.map(req => ({
          profilePicture: req.sender.imageUrl ?? req.sender.profilePicture,
          userName: req.sender.userName,
          _id: req.sender._id,
          sender: req.sender  // preserve original if needed
        }));
        this.filteredRequests = this.pendingRequests;
      },
      error: (error) => {
        console.error('Error fetching pending requests:', error);
        this.errorMessage = 'Failed to load pending requests';
      }
    });
  }

  searchRequests(): void {
    this.hasSearched = true;
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
    this.friendService.acceptRequest(senderId).subscribe({
      next: () => {
        this.pendingRequests = this.pendingRequests.filter(req => req.sender._id !== senderId);
        this.loadPendingRequests();
      },
      error: (error) => {
        console.error('Error accepting request:', error);
        this.errorMessage = 'Failed to accept request';
      }

    });
  }

  // Reject a friend request
  rejectRequest(senderId: string): void {
    this.friendService.rejectRequest(senderId).subscribe({
      next: () => {
        this.pendingRequests = this.pendingRequests.filter(req => req.sender._id !== senderId);
        this.loadPendingRequests();
      },
      error: (error) => {
        console.error('Error rejecting request:', error);
        this.errorMessage = 'Failed to reject request';
      }

    });
  }
}
