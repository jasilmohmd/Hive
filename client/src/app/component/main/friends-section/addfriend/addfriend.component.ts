import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FriendService } from '../../../../services/friends.service';
import { CommonTableComponent } from '../../../common/common-table/common-table.component';
import { EmptyStateComponent } from '../../../common/empty-state/empty-state.component';
import { TableAction, TableColumn } from '../../../../interface/table.interface';
import { debounceTime, Subject, Subscription } from 'rxjs';

@Component({
  selector: 'app-addfriend',
  standalone: true,
  imports: [FormsModule, CommonModule, CommonTableComponent, EmptyStateComponent],
  templateUrl: './addfriend.component.html',
  styleUrls: ['./addfriend.component.css']
})
export class AddfriendComponent implements OnDestroy {
  searchTerm: string = '';
  searchResults: any[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  hasSearched: boolean = false; // New state to track if search was performed


  // Define columns (example: only username)
  tableColumns: TableColumn[] = [
    { header: 'Profile', field: 'profilePicture', isImage: true },
    { header: 'Username', field: 'userName' }
  ];

  // Define primary action: Message button (always visible)
  primaryActions: TableAction[] = [
    {
      label: 'Send Request',
      action: (row: any) => this.sendFriendRequest(row._id),
      class: '!bg-success !text-surface-950 hover:!bg-success-hover px-4 py-2 text-sm rounded-md',
      display: "label"
    }
  ];

  // Subject to debounce search term changes
  private searchTermSubject = new Subject<string>();
  private searchSubscription?: Subscription;
  private searchChangesSubscription?: Subscription;

  constructor(private friendService: FriendService) { }

  ngOnInit(): void {
    // Subscribe to debounced search term changes
    this.searchChangesSubscription = this.searchTermSubject.pipe(
      debounceTime(300)
    ).subscribe(term => {
      this.performSearch(term);
    });
  }

  onSearchTermChange(): void {
    // Cancel immediately, including the debounce window, so an older response
    // cannot replace results for the username currently in the input.
    this.searchSubscription?.unsubscribe();
    this.isLoading = true;
    this.hasSearched = true;
    this.searchTermSubject.next(this.searchTerm);
  }

  /**
   * Triggers the search for users by username.
   */
  performSearch(term: string): void {
    this.searchSubscription?.unsubscribe();
    const trimmedUsername = term.trim();
    if (!trimmedUsername) {
      this.searchResults = [];
      this.errorMessage = '';
      this.isLoading = false;
      return;
    }

    
    this.errorMessage = '';
    this.searchResults = [];


    this.searchSubscription = this.friendService.searchUserByUsername(trimmedUsername)
      .subscribe({
        next: (response: any[]) => {
          this.searchResults = response.map(req => ({
            profilePicture: req.imageUrl ?? req.profilePicture,
            userName: req.userName,
            _id: req._id,
            sender: req  // preserve original if needed
          }));

          this.isLoading = false;
          this.hasSearched = true; // Mark that a search has been performed
        },
        error: (err) => {
          console.error('Error searching for user:', err);
          this.showMessage("Error searching for user. Please try again later.","error")
          this.isLoading = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
    this.searchChangesSubscription?.unsubscribe();
  }

  /**
   * Call the backend to send a friend request.
   * @param userId The ObjectId of the user to add.
   */
  sendFriendRequest(userId: string): void {
    this.friendService.sendFriendRequest(userId)
      .subscribe({
        next: () => {
          this.showMessage('Friend request sent!', 'success');
        },
        error: (err) => {
          this.showMessage(err.message || 'Failed to send friend request.', 'error');
        }
      });
  }

  /**
   * Show a disappearing modal message.
   * @param message Message to display.
   * @param type 'success' | 'error'
   */
  private showMessage(message: string, type: 'success' | 'error'): void {
    if (type === 'success') {
      this.successMessage = message;
    } else {
      this.errorMessage = message;
    }

    setTimeout(() => {
      this.successMessage = '';
      this.errorMessage = '';
    }, 2000); // Message disappears after 2 seconds
  }
}
