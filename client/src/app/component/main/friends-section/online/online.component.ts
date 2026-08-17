import { ChangeDetectorRef, Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { FriendService } from '../../../../services/friends.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableAction, TableColumn } from '../../../../interface/table.interface';
import { CommonTableComponent } from '../../../common/common-table/common-table.component';
import { CommonModalComponent } from '../../../common/common-modal/common-modal.component';
import { EmptyStateComponent } from '../../../common/empty-state/empty-state.component';

@Component({
  selector: 'app-online',
  standalone: true,
  imports: [CommonModule, FormsModule, CommonTableComponent, CommonModalComponent, EmptyStateComponent],
  templateUrl: './online.component.html',
  styleUrl: './online.component.css'
})
export class OnlineComponent {
  onlineFriends: any[] = [];  // Store online friends
  errorMessage: string = '';
  filteredOnlineFriends: any[] = [];  // Store filtered list of online friends based on search
  searchTerm: string = '';  // Search term entered by the user
  hasSearched: boolean = false; // Track if search was performed
  dropdownOpen: string | null = null;

  showSearchBar = true;
  private lastScrollTop = 0;

  // Define columns (example: only username)
  tableColumns: TableColumn[] = [
    { header: 'Profile', field: 'profilePicture', isImage: true },
    { header: 'Username', field: 'userName' }
  ];

  primaryActions: TableAction[] = [];

  // Define secondary actions: Unfriend and Block User in dropdown
  secondaryActions: TableAction[] = [
    {
      label: 'Unfriend',
      action: (row: any) => this.requestConfirmation('unfriend', row._id),
      // class: 'bg-red-500 hover:bg-red-600 px-4 py-2 text-sm rounded-md'
    },
    {
      label: 'Block User',
      action: (row: any) => this.requestConfirmation('block', row._id),
      // class: 'bg-yellow-500 hover:bg-yellow-600 px-4 py-2 text-sm rounded-md'
    }
  ];


  // For confirmation modal
  confirmModalVisible: boolean = false;
  pendingAction: { type: 'unfriend' | 'block', friendId: string } | null = null;

  constructor(
    private friendsService: FriendService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadOnlineFriends();  // Fetch online friends on component load
  }

  // Fetch online friends
  loadOnlineFriends(): void {

    // const dummyFriends = [
    //   { _id: '1', userName: 'Alice Johnson' },
    //   { _id: '2', userName: 'Bob Smith' },
    //   { _id: '3', userName: 'Charlie Brown' },
    //   { _id: '4', userName: 'David White' },
    //   { _id: '5', userName: 'Emma Davis' },
    //   { _id: '6', userName: 'Franklin Harris' },
    //   { _id: '7', userName: 'Grace Martinez' },
    //   { _id: '8', userName: 'Henry Wilson' },
    //   { _id: '9', userName: 'Isabella Thompson' },
    //   { _id: '10', userName: 'Jack Anderson' },
    //   { _id: '11', userName: 'Katherine Moore' },
    //   { _id: '12', userName: 'Liam Scott' },
    //   { _id: '13', userName: 'Mia Garcia' },
    //   { _id: '14', userName: 'Noah Robinson' },
    //   { _id: '15', userName: 'Olivia Clark' },
    //   { _id: '16', userName: 'Patrick Lewis' },
    //   { _id: '17', userName: 'Quinn Walker' },
    //   { _id: '18', userName: 'Ryan Hall' },
    //   { _id: '19', userName: 'Sophia Young' },
    //   { _id: '20', userName: 'Thomas King' }
    // ];

    // this.onlineFriends = dummyFriends;
    // this.filteredOnlineFriends = dummyFriends;

    this.friendsService.getOnlineFriends().subscribe({
      next: (response) => {
        this.onlineFriends = response; // Store the online friends list
        this.filteredOnlineFriends = response; // Default filtered list = full list
        console.log(response);
      },
      error: (error) => {
        console.error('Error fetching online friends:', error);
        this.errorMessage = 'Failed to load online friends list';
      }
    });
  }

  // Search online friends based on search term
  searchOnlineFriends(): void {
    const searchTermLower = this.searchTerm.toLowerCase();
    this.hasSearched = true;

    if (!searchTermLower) {
      this.filteredOnlineFriends = [...this.onlineFriends]; // If search is empty, show all online friends
      return;
    }

    this.filteredOnlineFriends = this.onlineFriends.filter(friend =>
      friend.userName.toLowerCase().includes(searchTermLower) // Filter based on userName
    );
  }


  // Instead of directly calling confirm(), we set the pending action and show the modal.
  requestConfirmation(actionType: 'unfriend' | 'block', friendId: string): void {
    this.pendingAction = { type: actionType, friendId };
    this.confirmModalVisible = true;
  }

  // Called when the user confirms the action in the modal.
  handleConfirmation(): void {
    if (!this.pendingAction) return;
    if (this.pendingAction.type === 'unfriend') {
      this.unfriend(this.pendingAction.friendId);
    } else if (this.pendingAction.type === 'block') {
      this.blockUser(this.pendingAction.friendId);
    }
    this.pendingAction = null;
    this.confirmModalVisible = false;
  }

  // Called when the user cancels the confirmation.
  cancelConfirmation(): void {
    this.pendingAction = null;
    this.confirmModalVisible = false;
  }

  unfriend(friendId: string): void {
    this.friendsService.unfriendUser(friendId).subscribe({
      next: () => {
        this.filteredOnlineFriends = this.filteredOnlineFriends.filter(
          (friend) => (friend._id ?? friend.id) !== friendId
        );
      },
      error: (error) => {
        console.error('Error unfriending user:', error);
      }
    });
  }


  blockUser(friendId: string): void {

    this.friendsService.blockUser(friendId).subscribe({
      next: () => {
        this.filteredOnlineFriends = this.filteredOnlineFriends.filter(
          (friend) => (friend._id ?? friend.id) !== friendId
        );
      },
      error: (error) => {
        console.error('Error blocking user:', error);
      }
    });

  }


  message(row: any): void {
    const friendId = row._id ?? row.id;
    if (!friendId) return;
    this.router.navigate(['/main/direct_message'], { queryParams: { friendId } });
  }


  toggleDropdown(friendId: string): void {
    this.dropdownOpen = this.dropdownOpen === friendId ? null : friendId;
  }

  @HostListener('window:scroll', [])
  onScroll() {
    console.log("hi");

    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    if (scrollTop > this.lastScrollTop + 10) {
      this.showSearchBar = false;
    } else if (scrollTop < this.lastScrollTop - 10) {
      this.showSearchBar = true;
    }

    this.lastScrollTop = scrollTop;
    this.cdr.detectChanges(); // Force update
  }

}
