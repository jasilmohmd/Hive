import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { FriendService, IUser } from '../../../services/friends.service';
import { ChatService } from '../../../services/chat.service';
import { CommunityService } from '../../../services/community.service';
import { ChannelService } from '../../../services/channel.service';
import ICommunity from '../../../models/community';

export interface IForwardChannelTarget {
  chatId: string;
  channelName: string;
  communityName: string;
}

@Component({
  selector: 'app-chat-forward-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-forward-picker.component.html',
})
export class ChatForwardPickerComponent implements OnInit {
  @Input() currentUserId: string | null = null;
  /** Hide forwarding back into the same chat (e.g. current channel). */
  @Input() excludeChatId: string | null = null;
  @Output() picked = new EventEmitter<string>();
  @Output() dismiss = new EventEmitter<void>();

  friends: IUser[] = [];
  channelTargets: IForwardChannelTarget[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private friendsService: FriendService,
    private communityService: CommunityService,
    private channelService: ChannelService,
    private chat: ChatService
  ) {}

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.dismiss.emit();
  }

  ngOnInit(): void {
    forkJoin({
      friends: this.friendsService.getAllFriends().pipe(catchError(() => of([] as IUser[]))),
      communities: this.communityService
        .getCommunitiesByUser()
        .pipe(catchError(() => of([] as ICommunity[]))),
    }).subscribe({
      next: ({ friends, communities }) => {
        this.friends = (friends ?? []).filter(
          (f: IUser) => f._id && f._id !== this.currentUserId
        );
        this.loadChannelTargets(communities ?? []);
      },
      error: (e: Error) => {
        this.error = e.message;
        this.loading = false;
      },
    });
  }

  private loadChannelTargets(communities: ICommunity[]): void {
    const withId = communities.filter((c) => !!c._id);
    if (!withId.length) {
      this.channelTargets = [];
      this.loading = false;
      return;
    }

    forkJoin(
      withId.map((community) =>
        this.channelService.getAccessibleChannels(community._id).pipe(
          map((grouped) => ({
            communityName: community.name,
            channels: grouped.chatroom ?? [],
          })),
          catchError(() => of({ communityName: community.name, channels: [] }))
        )
      )
    ).subscribe({
      next: (rows) => {
        const exclude = this.excludeChatId?.trim() ?? '';
        this.channelTargets = rows.flatMap(({ communityName, channels }) =>
          channels
            .filter((ch) => ch._id && ch.type === 'chatroom')
            .map((ch) => ({
              chatId: String(ch._id),
              channelName: ch.name,
              communityName,
            }))
            .filter((t) => !exclude || t.chatId !== exclude)
        );
        this.loading = false;
      },
      error: (e: Error) => {
        this.error = e.message;
        this.loading = false;
      },
    });
  }

  get hasTargets(): boolean {
    return this.friends.length > 0 || this.channelTargets.length > 0;
  }

  close(): void {
    this.dismiss.emit();
  }

  forwardToFriend(friend: IUser): void {
    if (!this.currentUserId) return;
    const chatId = ChatService.directChatId(this.currentUserId, friend._id);
    this.picked.emit(chatId);
  }

  forwardToChannel(target: IForwardChannelTarget): void {
    this.picked.emit(target.chatId);
  }
}
