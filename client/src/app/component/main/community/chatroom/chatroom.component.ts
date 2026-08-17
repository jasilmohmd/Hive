import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  combineLatest,
  map,
  of,
  Subscription,
  switchMap,
} from 'rxjs';
import { ChannelStateService } from '../../../../services/shared/channel-state.service';
import { ChannelChatPanelComponent } from '../channel-chat-panel/channel-chat-panel.component';

@Component({
  selector: 'app-chatroom',
  standalone: true,
  imports: [CommonModule, ChannelChatPanelComponent],
  templateUrl: './chatroom.component.html',
  styleUrl: './chatroom.component.css',
})
export class ChatroomComponent implements OnInit, OnDestroy {
  communityId = '';
  channelId = '';
  channelTitle = '';

  private subs = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private channelState: ChannelStateService
  ) {}

  ngOnInit(): void {
    const parentRoute = this.route.parent;
    if (!parentRoute) return;

    this.subs.add(
      combineLatest([parentRoute.paramMap, this.route.paramMap])
        .pipe(
          switchMap(([parentPm, childPm]) => {
            this.communityId = parentPm.get('id') ?? '';
            this.channelId = childPm.get('channelId') ?? '';
            if (!this.communityId || !this.channelId) {
              this.channelTitle = '';
              return of(null);
            }
            return this.channelState
              .loadAccessibleChannels(this.communityId)
              .pipe(
                map(
                  (list) =>
                    list?.find((c) => String(c._id) === this.channelId) ?? null
                )
              );
          })
        )
        .subscribe((channel) => {
          if (!this.channelId) {
            this.channelTitle = '';
            return;
          }
          this.channelTitle =
            channel?.name ?? `# channel ${this.channelId.slice(-6)}`;
        })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
