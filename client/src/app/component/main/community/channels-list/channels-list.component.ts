import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { catchError, of, Subscription, switchMap } from 'rxjs';
import { IChannel } from '../../../../models/channel';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { IRole } from '../../../../models/role';
import { ChannelStateService } from '../../../../services/shared/channel-state.service';
import {
  VoiceroomPresenceService,
  IVoiceroomPresenceUser,
} from '../../../../services/voiceroom-presence.service';
import { VoiceroomMediaIconsComponent } from '../voiceroom/voiceroom-media-icons.component';

@Component({
  selector: 'app-channels-list',
  standalone: true,
  imports: [CommonModule, RouterModule, VoiceroomMediaIconsComponent],
  templateUrl: './channels-list.component.html',
  styleUrl: './channels-list.component.css',
})
export class ChannelsListComponent implements OnInit, OnDestroy {
  @Input() communityId!: string;
  @Input() userRoles!: IRole[];

  channels: {
    [key in 'info' | 'chatroom' | 'voiceroom']?: IChannel[] | null;
  } = { info: [], chatroom: [], voiceroom: [] };
  isLoading = true;
  errorMessage: string | null = null;

  private subscriptions = new Subscription();
  private presenceMap: Record<string, IVoiceroomPresenceUser[]> = {};
  /**
   * Voice rooms this list is watching. The component is reused across
   * communities, and used to add each new community's rooms without dropping
   * the last one's — every community visited stayed subscribed.
   */
  private watchedRooms = new Set<string>();

  constructor(
    private route: ActivatedRoute,
    private channelStateService: ChannelStateService,
    private voiceroomPresence: VoiceroomPresenceService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.voiceroomPresence.subscribe((map) => {
        this.presenceMap = map;
      })
    );

    const channelSub = this.route.params
      .pipe(
        switchMap((params) => {
          this.isLoading = true;
          this.errorMessage = null;
          const id = params['id'];
          if (!id) {
            this.errorMessage = 'Community ID not found';
            return of(null);
          }
          this.communityId = id;

          return this.channelStateService
            .loadAccessibleChannels(id, true)
            .pipe(
              catchError((error) => {
                this.errorMessage =
                  error.message || 'Failed to load community';
                return of(null);
              })
            );
        })
      )
      .subscribe((channels) => {
        if (channels) {
          this.channels.info = channels.filter(
            (channel) => channel.type === 'info'
          );
          this.channels.chatroom = channels.filter(
            (channel) => channel.type === 'chatroom'
          );
          this.channels.voiceroom = channels.filter(
            (channel) => channel.type === 'voiceroom'
          );
        } else {
          this.channels = { info: [], chatroom: [], voiceroom: [] };
        }

        if (this.channels.voiceroom?.length) {
          this.channels.voiceroom = this.channels.voiceroom.map((channel) => ({
            ...channel,
            isOpen: channel.isOpen ?? false,
          }));
        }
        this.syncWatchedRooms(
          (this.channels.voiceroom ?? [])
            .map((c) => c._id)
            .filter((id): id is string => !!id)
        );

        this.isLoading = false;
      });

    this.subscriptions.add(channelSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.syncWatchedRooms([]);
  }

  private syncWatchedRooms(ids: string[]): void {
    const next = new Set(ids);
    for (const id of this.watchedRooms) {
      if (!next.has(id)) this.voiceroomPresence.unwatch(id);
    }
    for (const id of next) {
      if (!this.watchedRooms.has(id)) this.voiceroomPresence.watch(id);
    }
    this.watchedRooms = next;
  }

  toggleRoom(room: IChannel, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    room.isOpen = !room.isOpen;
  }

  presenceFor(room: IChannel): IVoiceroomPresenceUser[] {
    if (!room._id) return [];
    return this.presenceMap[room._id] ?? [];
  }

  presenceCount(room: IChannel): number {
    return this.presenceFor(room).length;
  }

  initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
}
