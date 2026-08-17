import { ChangeDetectorRef, Component, ElementRef, inject, Input, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IRole } from '../../../../models/role';
import { CommunityStateService } from '../../../../services/shared/community-state.service';
import { RoleStateService } from '../../../../services/shared/role-state.service';
import { ListModalComponent } from '../list-modal/list-modal.component';
import { TableAction, TableColumn } from '../../../../interface/table.interface';
import { Validators } from '@angular/forms';
import channelCreateFields from '../../../../constants/channel';
import { ChannelService } from '../../../../services/channel.service';
import { ChannelStateService } from '../../../../services/shared/channel-state.service';
import { CommonModalComponent } from '../../../common/common-modal/common-modal.component';
import { FriendService } from '../../../../services/friends.service';
import { CommunityService } from '../../../../services/community.service';
import { ImagePickerMenuComponent } from '../../../common/image-picker-menu/image-picker-menu.component';
import { ToastService } from '../../../../services/toast.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, ListModalComponent, CommonModalComponent, ImagePickerMenuComponent],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css'
})
export class AboutComponent {
  communityId: string = "";
  community: any | null = null;
  isLoading: boolean = true;
  errorMessage: string | null = null;
  userRoles: IRole[] = [];
  permissions: string[] = [];

  showConfirmModal: boolean = false;
  channelToDelete: any = null;

  // Modal related properties
  showModal: boolean = false;
  modalData: {
    title?: string;
    addAction?: TableAction;
    createFields?: { field: string, label: string, type?: string }[];
    data?: any[];
    columns?: TableColumn[];
    primaryActions?: TableAction[];
    secondaryActions?: TableAction[];
    showFallbackInitial?: boolean;
    searchFields?: string[];
    mode?: 'create' | 'edit' | 'add' | 'search';
  } = {};

  private hasScrolled: boolean = false;
  @ViewChild('detailsSection') detailsSection!: ElementRef;
  @ViewChild('coverAnchor') coverAnchor!: ElementRef;

  @ViewChild(ListModalComponent) listModal!: ListModalComponent;


  private subscriptions: Subscription = new Subscription();
  private toast = inject(ToastService);

  constructor(
    private route: ActivatedRoute,
    private communityStateService: CommunityStateService,
    private roleStateService: RoleStateService,
    private channelStateService: ChannelStateService,
    private communityService: CommunityService,
    private channelService: ChannelService,
    private friendService: FriendService,
    private cd: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    const communitySub = this.route.parent?.params.subscribe(params => {
      this.communityId = params['id'];
      if (!this.communityId) {
        this.errorMessage = 'Community ID not found';
        this.isLoading = false;
        return;
      }

      this.communityStateService.loadCommunity(this.communityId).subscribe(community => {
        this.community = community;
        this.cd.markForCheck();
        this.isLoading = false;
      });

      // Load user roles via the RoleStateService.
      this.roleStateService.loadUserRoles(this.communityId).subscribe();

      // Subscribe to role state updates.
      const rolesSub = this.roleStateService.userRoles$.subscribe(roles => {
        this.userRoles = roles;
      });
      const permsSub = this.roleStateService.permissions$.subscribe(perms => {
        this.permissions = perms;
      });

      this.subscriptions.add(rolesSub);
      this.subscriptions.add(permsSub);

    });

    this.subscriptions.add(communitySub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get canManageCommunity(): boolean {
    return this.permissions.includes('MANAGE_COMMUNITY');
  }

  onCommunityIconUploaded(url: string): void {
    this.communityService.updateCommunity(this.communityId, { imageUrl: url }).subscribe({
      next: () => {
        this.toast.success('Community icon updated');
        this.reloadCommunity();
      },
      error: (err: Error) => this.toast.error(err.message || 'Update failed'),
    });
  }

  onCommunityCoverUploaded(url: string): void {
    this.communityService.updateCommunity(this.communityId, { coverImageUrl: url }).subscribe({
      next: () => {
        this.toast.success('Cover image updated');
        this.reloadCommunity();
      },
      error: (err: Error) => this.toast.error(err.message || 'Update failed'),
    });
  }

  private reloadCommunity(): void {
    this.communityStateService.loadCommunity(this.communityId, true).subscribe((c) => {
      this.community = c;
      this.cd.markForCheck();
    });
  }

  ngAfterViewChecked() {
    if (this.community && !this.hasScrolled) {
      this.scrollToDetails();
      this.hasScrolled = true;
    }
  }

  private scrollToDetails() {
    setTimeout(() => {
      if (this.detailsSection?.nativeElement) {
        this.detailsSection.nativeElement.scrollIntoView({
          behavior: 'instant',
          block: 'start'
        });

        // Optional: Add slight offset
        window.scrollBy(0, -80); // Adjust this value as needed
      }
    }, 50);
  }

  // Method to manually scroll to cover image
  scrollToCover() {
    if (this.coverAnchor?.nativeElement) {
      this.coverAnchor.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  // Example method to trigger the modal (for managing channels)
  manageChannels() {
    const columns: TableColumn[] = [
      { field: 'name', header: 'Name' },
      { field: 'type', header: 'Type' }
    ];
    const primaryActions: TableAction[] = [
      {
        label: 'Edit',
        action: (channel: any) => this.handleModalAction({ action: 'edit', item: channel }),
        class: 'px-3 py-1 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors'
      },
      {
        label: 'Delete',
        action: (channel: any) => this.handleModalAction({ action: 'delete', item: channel }),
        class: 'px-3 py-1 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors'
      }
    ];

    const createfields = [
      ...channelCreateFields,
      {
        field: 'allowedRoles',
        label: 'Allowed Roles',
        type: 'checkbox',
        options: this.community && this.community.roles
          ? this.community.roles.map((role: any) => ({
            value: role._id,
            label: role.name,
            // Mark Owner and Admin as permanent
            disabled: (role.name === 'Owner' || role.name === 'Admin')
          }))
          : [],
        defaultValue: this.community && this.community.roles
          ? this.community.roles.filter((role: any) => role.name === 'Owner' || role.name === 'Admin').map((role: any) => role._id)
          : []
      }
    ];

    this.modalData = {
      title: 'Channel',
      addAction: {
        label: 'Create',
        action: (channel: any) => this.handleModalAction(channel)
      },
      createFields: createfields,
      data: this.community.channels,
      columns: columns,
      primaryActions: primaryActions,
      secondaryActions: [],
      searchFields: ['name'],
      mode: 'create'
    };
    this.showModal = true;
  }

  handleModalAction(event: { action: string, item: any }) {
    const actionLabel = event.action.toLowerCase();
    if (actionLabel === 'create') {
      console.log('Submitting new channel:', event.item);
      this.createChannel(this.communityId, event.item);
    } else if (actionLabel === 'edit') {
      console.log('Editing channel (opening modal):', event.item);
      this.modalData.mode = 'edit';
      this.showModal = true;
      setTimeout(() => {
        this.listModal.startCreate();
        this.listModal.patchForm(event.item);
      }, 0);
    } else if (actionLabel === 'submitedit') {
      console.log('Submitting edit for channel:', event.item);
      this.editChannel(this.communityId, event.item._id, event.item);
    } else if (actionLabel === 'delete') {
      console.log('Delete requested for channel:', event.item);
      // Instead of deleting immediately, show the confirmation modal.
      this.channelToDelete = event.item;
      this.showConfirmModal = true;
    }
  }


  onDeleteConfirmed() {
    if (this.channelToDelete) {
      console.log('Deleting channel:', this.channelToDelete);
      this.deleteChannel(this.communityId, this.channelToDelete._id);
      this.channelToDelete = null;
    }
    this.showConfirmModal = false;
  }

  onDeleteCancelled() {
    this.channelToDelete = null;
    this.showConfirmModal = false;
  }


  createChannel(communityId: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      this.channelService.createChannel(communityId, data).subscribe({
        next: (res) => {
          console.log('Channel created:', res);
          // Refresh community state and update local properties and modal data
          this.communityStateService.loadCommunity(communityId, true).subscribe(community => {
            this.community = community;
            // Update modal data if needed (e.g., if modalData.data comes from community.channels)
            this.modalData.data = community ? community.channels : [];
            // Force change detection
            this.cd.detectChanges();
          });
          // Also refresh channels state if needed.
          this.channelStateService.loadAccessibleChannels(communityId, true).subscribe();
          resolve();
        },
        error: (err) => {
          console.error('Creation failed:', err);
          reject(err);
        }
      });
    });
  }

  editChannel(communityId: string, channelId: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      this.channelService.editChannel(communityId, channelId, data).subscribe({
        next: (res) => {
          console.log('Channel updated:', res);
          this.communityStateService.loadCommunity(communityId, true).subscribe(community => {
            this.community = community;
            this.modalData.data = community ? community.channels : [];
            this.cd.detectChanges();
          });
          this.channelStateService.loadAccessibleChannels(communityId, true).subscribe();
          resolve();
        },
        error: (err) => {
          console.error('Updation failed:', err);
          reject(err);
        }
      });
    });
  }

  deleteChannel(communityId: string, channelId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.channelService.deleteChannel(communityId, channelId).subscribe({
        next: (res) => {
          console.log('Channel deleted:', res);
          this.communityStateService.loadCommunity(communityId, true).subscribe(community => {
            this.community = community;
            this.modalData.data = community ? community.channels : [];
            this.cd.detectChanges();
          });
          this.channelStateService.loadAccessibleChannels(communityId, true).subscribe();
          resolve();
        },
        error: (err) => {
          console.error('Deletion failed:', err);
          reject(err);
        }
      });
    });
  }

  manageMembers() {

    const mappedMembers = this.community.members.map((member: any) => ({
      _id: member._id,
      userName: member.userId?.userName || 'Unknown',
      roles: member.roleIds?.map((role: any) => role.name).join(', ') || 'No roles'
    }));

    const columns: TableColumn[] = [
      { field: 'userName', header: 'Name' },
      { field: 'roles', header: 'Roles' }
    ];
    const primaryActions: TableAction[] = [
      {
        label: 'Manage',
        action: (member: any) => this.handleModalAction({ action: 'edit', item: member }),
        class: 'px-3 py-1 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors'
      },
      {
        label: 'Remove',
        action: (member: any) => this.handleModalAction({ action: 'delete', item: member }),
        class: 'px-3 py-1 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors'
      }
    ];

    this.modalData = {
      title: 'Member',
      addAction: {
        label: 'Add',
        action: (item) => this.openAddMemberModal(item)
      },
      data: mappedMembers,
      columns: columns,
      primaryActions: primaryActions,
      secondaryActions: [],
      showFallbackInitial: true,
      searchFields: ['userName'],
      mode: 'add'
    };
    this.showModal = true;
  }

  openAddMemberModal(item: any) {
    console.log('Opening user search modal to add a member.');
    this.modalData = {
      title: 'Add Members',
      data: [], // This will be populated by your search function
      columns: [
        { field: 'userName', header: 'Name' },
        { field: 'email', header: 'Email' }
      ],
      primaryActions: [
        {
          label: 'Add',
          action: (user: any) => this.addUserToCommunity(user),
          class: 'px-3 py-1 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors'
        }
      ],
      secondaryActions: [],
      searchFields: ['userName', 'email'],
      mode: 'search'
    };
    this.showModal = true;
  }

  addUserToCommunity(user: any) {
    const memberRole = this.community.roles.find((role: any) => role.name.toLowerCase() === 'member');
    const roleId: string = memberRole ? memberRole._id : '';

    if (!roleId) {
      console.error('No default member role found.');
      return;
    }

    console.log('Adding user:', this.communityId, user._id, roleId);
    this.communityService.addMember(this.communityId, user._id, roleId).subscribe({
      next: (response) => {
        console.log(response);
        this.communityStateService.loadCommunity(this.communityId, true).subscribe(community => {
          this.community = community;
          const mappedMembers = this.community.members.map((member: any) => ({
            _id: member._id,
            userName: member.userId?.userName || 'Unknown',
            roles: member.roleIds?.map((role: any) => role.name).join(', ') || 'No roles'
          }));
          this.modalData.data = community ? mappedMembers : [];
          this.cd.detectChanges();
        });
      },
      error: (error) => {
        console.log(error);
        this.errorMessage = error.message
      }
    })

  }

  searchUsers(searchQuery: string) {

    if (this.modalData.mode !== 'search') {
      return;
    }

    console.log('Searching users for query:', searchQuery);

    this.friendService.searchUserByUsername(searchQuery).subscribe({
      next: (response) => {
        this.modalData.data = response.map((user: any) => ({
          _id: user._id,
          userName: user.userName,
          email: user.email
        }));
      },
      error: (error) => {
        console.log(error);
        this.errorMessage = error.message;
      }
    })

  }



}
