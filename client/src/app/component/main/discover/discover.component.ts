import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CommunityService } from '../../../services/community.service';
import ICommunity from '../../../models/community';
import { LoadingStateComponent } from '../../common/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../common/empty-state/empty-state.component';
import { ErrorAlertComponent } from '../../common/error-alert/error-alert.component';

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingStateComponent, EmptyStateComponent, ErrorAlertComponent],
  templateUrl: './discover.component.html',
  styleUrl: './discover.component.css'
})
export class DiscoverComponent implements OnInit {
  communities: ICommunity[] = [];
  loading = true;
  errorMessage: string | null = null;

  constructor(private communityService: CommunityService) {}

  ngOnInit(): void {
    this.communityService.listCommunities().subscribe({
      next: (list) => {
        this.communities = list ?? [];
        this.loading = false;
      },
      error: (e: Error) => {
        this.errorMessage = e.message;
        this.loading = false;
      }
    });
  }

  trackCommunity(_index: number, c: ICommunity): string {
    return c._id;
  }
}
