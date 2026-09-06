import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterModule, RouterOutlet } from '@angular/router';
import { CreateCommunityLayoutComponent } from '../create-community/layout/layout.component';
import { CommonModule } from '@angular/common';
import { CommunityService } from '../../../services/community.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';
import { IncomingCallModalComponent } from '../../common/incoming-call-modal/incoming-call-modal.component';
import { CallService } from '../../../services/call.service';
import { ChatService } from '../../../services/chat.service';
import { Subscription } from 'rxjs';
import { ChannelSidebarService } from '../../../services/shared/channel-sidebar.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterOutlet,
    CreateCommunityLayoutComponent,
    IncomingCallModalComponent,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css',
})
export class LayoutComponent implements OnInit, OnDestroy {
  showCommunityCreateModal = false;
  communities: any[] = [];
  pageTitle = 'Hive';

  /**
   * The channel sidebar's show/hide control lives in this shell's navigation
   * rather than inside the sidebar, so that hiding it leaves nothing behind —
   * a collapsed stub column in the routed view was just dead space.
   *
   * Only meaningful on a community route, hence inCommunity.
   */
  channelSidebarCollapsed = false;
  inCommunity = false;

  private subs = new Subscription();

  constructor(
    private communityService: CommunityService,
    private sanitizer: DomSanitizer,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private call: CallService,
    private chat: ChatService,
    private channelSidebar: ChannelSidebarService
  ) {}

  ngOnInit(): void {
    void this.chat.connectRealtime().catch((err) => {
      console.error('Realtime connect failed:', err);
    });
    this.loadCommunities();
    this.updatePageTitle();
    this.updateInCommunity();
    this.subs.add(
      this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe(() => {
        this.updatePageTitle();
        this.updateInCommunity();
      })
    );
    this.subs.add(
      this.channelSidebar.collapsed$.subscribe((collapsed) => {
        this.channelSidebarCollapsed = collapsed;
      })
    );
  }

  toggleChannelSidebar(): void {
    this.channelSidebar.toggle();
  }

  /**
   * The create-community wizard also lives under /main/community, so match the
   * id segment rather than the prefix alone — it has no channel sidebar.
   */
  private updateInCommunity(): void {
    this.inCommunity = /\/main\/community\/(?!create)[^/]+/.test(this.router.url);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    if (this.call.isInCall()) {
      this.call.endCall();
    }
  }

  private updatePageTitle(): void {
    const leaf = this.deepestChild(this.activatedRoute);
    const title = leaf.snapshot.data['title'];
    if (typeof title === 'string' && title.length > 0) {
      this.pageTitle = title;
    }
  }

  private deepestChild(route: ActivatedRoute): ActivatedRoute {
    let r = route;
    while (r.firstChild) {
      r = r.firstChild;
    }
    return r;
  }

  loadCommunities(): void {
    this.communityService.getCommunitiesByUser().subscribe({
      next: (response) => {
        this.communities = response;
      },
      error: (error) => {
        console.log(error.message);
      },
    });
  }

  getSafeUrl(url: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  toggleCommunityCreateModal(): void {
    this.showCommunityCreateModal = !this.showCommunityCreateModal;
  }
}
