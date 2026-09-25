import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';
import { VoiceroomService } from '../../../../services/voiceroom.service';
import { ChannelStateService } from '../../../../services/shared/channel-state.service';

@Component({
  selector: 'app-voice-session-bar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './voice-session-bar.component.html',
  styleUrl: './voice-session-bar.component.css',
})
export class VoiceSessionBarComponent implements OnInit, OnDestroy {
  @Input({ required: true }) communityId!: string;

  connected = false;
  channelId: string | null = null;
  channelName = 'Voice room';
  localMuted = false;
  /** The room's own community — can differ from the one being viewed. */
  roomCommunityId: string | null = null;

  private subs = new Subscription();

  constructor(
    public voiceroom: VoiceroomService,
    private channels: ChannelStateService
  ) {}

  ngOnInit(): void {
    this.subs.add(
      this.voiceroom.connected$.subscribe((c) => {
        this.connected = c;
        this.channelId = this.voiceroom.activeChannelId;
        if (!c) {
          this.channelName = 'Voice room';
        }
      })
    );
    this.subs.add(
      this.voiceroom.activeChannelName$.subscribe((name) => {
        if (name) {
          this.channelName = name;
        } else if (this.channelId) {
          void this.resolveChannelName(this.channelId);
        }
      })
    );
    this.subs.add(this.voiceroom.localMuted$.subscribe((m) => (this.localMuted = m)));
    this.subs.add(this.voiceroom.activeCommunityId$.subscribe((id) => (this.roomCommunityId = id)));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  /**
   * The layout is reused when you switch communities while staying connected,
   * so link through the room's own community — pairing the viewed community's
   * id with the room's channel id produced a dead link.
   */
  get voiceroomLink(): (string | undefined)[] {
    const communityId = this.roomCommunityId || this.communityId;
    if (!communityId || !this.channelId) return [];
    return [
      '/main',
      'community',
      communityId,
      'voiceroom',
      this.channelId,
    ];
  }

  toggleMute(): void {
    void this.voiceroom.toggleMute();
  }

  async leaveCall(): Promise<void> {
    await this.voiceroom.leaveActiveCall();
  }

  private async resolveChannelName(channelId: string): Promise<void> {
    try {
      const list = await firstValueFrom(
        this.channels.loadAccessibleChannels(this.roomCommunityId || this.communityId)
      );
      const ch = list?.find((c) => String(c._id) === channelId);
      if (ch?.name) {
        this.channelName = ch.name;
      }
    } catch {
      /* ignore */
    }
  }
}
