import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, Output } from '@angular/core';
import { ChannelsListComponent } from '../channels-list/channels-list.component';
import { VoiceSessionBarComponent } from '../voice-session-bar/voice-session-bar.component';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { VoiceroomService } from '../../../../services/voiceroom.service';
import { LoadingStateComponent } from '../../../common/loading-state/loading-state.component';
import { ErrorAlertComponent } from '../../../common/error-alert/error-alert.component';
import { Subscription } from 'rxjs';
import ICommunity from '../../../../models/community';
import { CommunityStateService } from '../../../../services/shared/community-state.service';
import { RoleStateService } from '../../../../services/shared/role-state.service';
import { IRole } from '../../../../models/role';
import { UserAuthService } from '../../../../services/user-auth.service';

@Component({
  selector: 'community-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    ChannelsListComponent,
    VoiceSessionBarComponent,
    LoadingStateComponent,
    ErrorAlertComponent,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class ComunityLayoutComponent implements OnInit, OnDestroy {
  communityId: string = "";
  community: ICommunity | null = null;
  isLoading: boolean = true;
  errorMessage: string | null = null;
  userRoles: IRole[] = [];
  permissions: string[] = [];
  currentUserName: string = 'User';
  currentUserImage: string = '/assets/images/community/Profile/comedyclub.jpg';
  voiceSessionActive = false;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private communityStateService: CommunityStateService,
    private roleStateService: RoleStateService,
    private authService: UserAuthService,
    private voiceroom: VoiceroomService
  ) { }

  ngOnInit(): void {
    const communitySub = this.route.params.subscribe(params => {
      this.communityId = params['id'];
      if (!this.communityId) {
        this.errorMessage = 'Community ID not found';
        this.isLoading = false;
        return;
      }

      this.communityStateService.loadCommunity(this.communityId).subscribe(community => {
        this.community = community;
        // console.log(community);
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

    const userSub = this.authService.getUserDetails().subscribe({
      next: (res) => {
        this.currentUserName = res.userData?.userName || 'User';
        this.currentUserImage = res.userData?.imageUrl || this.currentUserImage;
      }
    });
    this.subscriptions.add(userSub);

    this.subscriptions.add(
      this.voiceroom.connected$.subscribe((c) => {
        this.voiceSessionActive = c;
      })
    );
  }

  ngOnDestroy(): void {
    void this.voiceroom.leaveActiveCall();
    this.subscriptions.unsubscribe();
  }

}
