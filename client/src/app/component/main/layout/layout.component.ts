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

  private subs = new Subscription();

  constructor(
    private communityService: CommunityService,
    private sanitizer: DomSanitizer,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private call: CallService,
    private chat: ChatService
  ) {}

  ngOnInit(): void {
    void this.chat.connectRealtime().catch((err) => {
      console.error('Realtime connect failed:', err);
    });
    this.loadCommunities();
    this.updatePageTitle();
    this.subs.add(
      this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe(() => {
        this.updatePageTitle();
      })
    );
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
