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
    this.syncMuted();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  get voiceroomLink(): (string | undefined)[] {
    if (!this.communityId || !this.channelId) return [];
    return [
      '/main',
      'community',
      this.communityId,
      'voiceroom',
      this.channelId,
    ];
  }

  toggleMute(): void {
    void this.voiceroom.toggleMute().then(() => this.syncMuted());
  }

  async leaveCall(): Promise<void> {
    await this.voiceroom.leaveActiveCall();
  }

  private syncMuted(): void {
    this.localMuted = this.voiceroom.localMuted;
  }

  private async resolveChannelName(channelId: string): Promise<void> {
    try {
      const list = await firstValueFrom(
        this.channels.loadAccessibleChannels(this.communityId)
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
