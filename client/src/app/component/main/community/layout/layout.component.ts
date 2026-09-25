import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ChannelsListComponent } from '../channels-list/channels-list.component';
import { VoiceSessionBarComponent } from '../voice-session-bar/voice-session-bar.component';
import { VoiceroomAudioComponent } from '../voiceroom-audio/voiceroom-audio.component';
import { ActivatedRoute, NavigationEnd, Router, RouterModule, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { VoiceroomService } from '../../../../services/voiceroom.service';
import { LoadingStateComponent } from '../../../common/loading-state/loading-state.component';
import { ErrorAlertComponent } from '../../../common/error-alert/error-alert.component';
import { Subscription } from 'rxjs';
import ICommunity from '../../../../models/community';
import { CommunityStateService } from '../../../../services/shared/community-state.service';
import { RoleStateService } from '../../../../services/shared/role-state.service';
import { IRole } from '../../../../models/role';
import { UserAuthService } from '../../../../services/user-auth.service';
import { ChannelSidebarService } from '../../../../services/shared/channel-sidebar.service';
import { ButtonComponent } from '../../../common/button/button.component';

@Component({
  selector: 'community-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    ButtonComponent,
    ChannelsListComponent,
    VoiceSessionBarComponent,
    VoiceroomAudioComponent,
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
  /** Null until known — the template falls back to initials, not a stock photo. */
  currentUserImage: string | null = null;
  voiceSessionActive = false;
  localMuted = false;
  deafened = false;

  /**
   * Mirrors ChannelSidebarService. The control that flips it lives in the app
   * shell's navigation, which is not an ancestor of this component in any
   * template — hence the service rather than an @Input or local state.
   */
  sidebarCollapsed = false;
  /** Below md the sidebar is a slide-over drawer (see ChannelSidebarService). */
  isPhone = false;
  mobileOpen = false;

  @ViewChild('drawerClose') private drawerClose?: ElementRef<HTMLButtonElement>;

  private subscriptions: Subscription = new Subscription();
  /** Holds subscriptions created per-community so they can be torn down before the next one is set up. */
  private routeParamSubscriptions: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private communityStateService: CommunityStateService,
    private roleStateService: RoleStateService,
    private authService: UserAuthService,
    private voiceroom: VoiceroomService,
    private channelSidebar: ChannelSidebarService,
    private router: Router
  ) { }

  /** Classes for the one <aside>, which is a drawer on phones and a column from md. */
  get asideClasses(): string[] {
    if (!this.isPhone) {
      return ['h-full', 'md:w-1/6', 'md:min-w-[13rem]', 'md:max-w-[18rem]'];
    }
    const classes = [
      'cl-drawer', 'fixed', 'inset-y-0', 'left-0', 'z-[60]', 'w-[min(85vw,20rem)]',
      'bg-surface-950', 'p-2', 'pt-[max(0.5rem,env(safe-area-inset-top))]',
      'pb-[calc(var(--safe-bottom)+0.5rem)]', 'shadow-2xl',
    ];
    if (this.mobileOpen) classes.push('cl-drawer--open');
    return classes;
  }

  closeDrawer(): void {
    this.channelSidebar.closeMobile();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isPhone && this.mobileOpen) this.closeDrawer();
  }

  retry(): void {
    if (!this.communityId) return;
    this.isLoading = true;
    this.errorMessage = null;
    this.loadCommunity(this.communityId, true);
  }

  toggleMute(): void {
    void this.voiceroom.toggleMute();
  }

  toggleDeafen(): void {
    void this.voiceroom.toggleDeafen();
  }

  initials(name: string | undefined): string {
    const parts = (name || '?').trim().split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] ?? '?') + (parts[1]?.[0] ?? '')).toUpperCase();
  }

  ngOnInit(): void {
    this.subscriptions.add(
      this.channelSidebar.collapsed$.subscribe((collapsed) => {
        this.sidebarCollapsed = collapsed;
      })
    );
    this.subscriptions.add(
      this.channelSidebar.isPhone$.subscribe((isPhone) => (this.isPhone = isPhone))
    );
    this.subscriptions.add(
      this.channelSidebar.mobileOpen$.subscribe((open) => {
        this.mobileOpen = open;
        // Put focus in the drawer when it opens, so keyboard and screen-reader
        // users land in it rather than behind it.
        if (open) setTimeout(() => this.drawerClose?.nativeElement.focus(), 0);
      })
    );
    // Picking a channel navigates; the drawer's job is done.
    this.subscriptions.add(
      this.router.events
        .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
        .subscribe(() => this.closeDrawer())
    );

    const communitySub = this.route.params.subscribe(params => {
      // Tear down the previous community's subscriptions before creating new ones,
      // since this component is reused (not recreated) when switching communities.
      this.routeParamSubscriptions.unsubscribe();
      this.routeParamSubscriptions = new Subscription();

      this.communityId = params['id'];
      if (!this.communityId) {
        this.errorMessage = 'Community ID not found';
        this.isLoading = false;
        return;
      }

      this.errorMessage = null;
      this.isLoading = true;
      this.loadCommunity(this.communityId);

      // Load user roles via the RoleStateService. Tracked with the other
      // per-community subscriptions so that switching communities quickly
      // cancels it — a late response for the previous community used to
      // overwrite this one's permissions.
      this.routeParamSubscriptions.add(
        this.roleStateService.loadUserRoles(this.communityId).subscribe({ error: () => undefined })
      );

      // Subscribe to role state updates.
      this.routeParamSubscriptions.add(
        this.roleStateService.userRoles$.subscribe(roles => {
          this.userRoles = roles;
        })
      );
      this.routeParamSubscriptions.add(
        this.roleStateService.permissions$.subscribe(perms => {
          this.permissions = perms;
        })
      );
    });

    this.subscriptions.add(communitySub);

    const userSub = this.authService.getUserDetails().subscribe({
      next: (res) => {
        this.currentUserName = res.userData?.userName || 'User';
        this.currentUserImage = res.userData?.imageUrl || null;
      },
      // The panel just keeps its "User" placeholder; nothing else depends on it.
      error: () => undefined,
    });
    this.subscriptions.add(userSub);

    this.subscriptions.add(
      this.voiceroom.connected$.subscribe((c) => {
        this.voiceSessionActive = c;
      })
    );
    this.subscriptions.add(this.voiceroom.localMuted$.subscribe((m) => (this.localMuted = m)));
    this.subscriptions.add(this.voiceroom.deafened$.subscribe((d) => (this.deafened = d)));
  }

  /**
   * CommunityStateService maps a failed load to null. That used to leave
   * isLoading false, errorMessage null and community null — a blank pane
   * with nothing to do. Now it's an error with a way out.
   */
  private loadCommunity(id: string, forceRefresh = false): void {
    this.routeParamSubscriptions.add(
      this.communityStateService.loadCommunity(id, forceRefresh).subscribe((community) => {
        this.isLoading = false;
        if (community) {
          this.community = community;
          this.errorMessage = null;
        } else if (!this.community || this.community._id !== id) {
          this.community = null;
          this.errorMessage =
            "It may have been deleted, or you may not have access to it. Check your connection and try again.";
        }
      })
    );
  }

  ngOnDestroy(): void {
    void this.voiceroom.leaveActiveCall();
    this.routeParamSubscriptions.unsubscribe();
    this.subscriptions.unsubscribe();
  }

}
