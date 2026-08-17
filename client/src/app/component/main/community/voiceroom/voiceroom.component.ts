import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';
import {
  VoiceroomService,
  IVoiceroomParticipantView,
} from '../../../../services/voiceroom.service';
import {
  VoiceroomPresenceService,
  IVoiceroomPresenceUser,
} from '../../../../services/voiceroom-presence.service';
import { ChannelService } from '../../../../services/channel.service';
import { UserAuthService } from '../../../../services/user-auth.service';
import { IChannel } from '../../../../models/channel';
import { LoadingStateComponent } from '../../../common/loading-state/loading-state.component';
import { ErrorAlertComponent } from '../../../common/error-alert/error-alert.component';
import { LkTrackAttachDirective } from './lk-track-attach.directive';
import { VoiceroomMediaIconsComponent } from './voiceroom-media-icons.component';
import { ChannelChatPanelComponent } from '../channel-chat-panel/channel-chat-panel.component';

@Component({
  selector: 'app-voiceroom',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LoadingStateComponent,
    ErrorAlertComponent,
    LkTrackAttachDirective,
    VoiceroomMediaIconsComponent,
    ChannelChatPanelComponent,
  ],
  templateUrl: './voiceroom.component.html',
  styleUrl: './voiceroom.component.css',
})
export class VoiceroomComponent implements OnInit, OnDestroy {
  channelId: string | null = null;
  communityId: string | null = null;
  channel: IChannel | null = null;
  participants: IVoiceroomParticipantView[] = [];
  lobbyPresence: IVoiceroomPresenceUser[] = [];
  maxParticipants = 6;
  loading = true;
  joining = false;
  errorMessage: string | null = null;
  connected = false;
  audioPlaybackBlocked = false;

  expandedParticipantId: string | null = null;
  expandedScreenId: string | null = null;
  minimizedTrayHidden = false;
  /** Screen-share row in normal (non-fullscreen) grid layout */
  gridScreenStripHidden = false;
  chatPanelOpen = false;

  private subs = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public voiceroom: VoiceroomService,
    private presence: VoiceroomPresenceService,
    private channels: ChannelService,
    private auth: UserAuthService
  ) {}

  get screenShares(): IVoiceroomParticipantView[] {
    return this.participants.filter((p) => p.screenTrack);
  }

  get expandedParticipant(): IVoiceroomParticipantView | null {
    if (!this.expandedParticipantId) return null;
    return (
      this.participants.find((p) => p.identity === this.expandedParticipantId) ??
      null
    );
  }

  get expandedScreen(): IVoiceroomParticipantView | null {
    if (!this.expandedScreenId) return null;
    return (
      this.participants.find((p) => p.identity === this.expandedScreenId) ??
      null
    );
  }

  get otherParticipants(): IVoiceroomParticipantView[] {
    if (!this.expandedParticipantId) return this.participants;
    return this.participants.filter(
      (p) => p.identity !== this.expandedParticipantId
    );
  }

  get otherScreenShares(): IVoiceroomParticipantView[] {
    if (!this.expandedScreenId) return this.screenShares;
    return this.screenShares.filter((p) => p.identity !== this.expandedScreenId);
  }

  get isFullscreen(): boolean {
    return !!(this.expandedParticipantId || this.expandedScreenId);
  }

  ngOnInit(): void {
    this.subs.add(
      this.auth.getUserDetails().subscribe({
        next: (res) => {
          const img = res.userData?.imageUrl;
          this.voiceroom.setLocalProfile(
            typeof img === 'string' && img.trim() ? img.trim() : null
          );
        },
      })
    );

    this.subs.add(
      this.route.paramMap.subscribe((params) => {
        const nextId = params.get('channelId');
        this.communityId =
          this.route.parent?.parent?.snapshot.paramMap.get('id') ?? null;
        void this.switchChannel(nextId);
      })
    );

    this.subs.add(
      this.voiceroom.participants$.subscribe((p) => {
        this.participants = p;
        if (
          this.expandedParticipantId &&
          !p.some((x) => x.identity === this.expandedParticipantId)
        ) {
          this.expandedParticipantId = null;
        }
        if (
          this.expandedScreenId &&
          !p.some((x) => x.identity === this.expandedScreenId)
        ) {
          this.expandedScreenId = null;
        }
      })
    );

    this.subs.add(
      this.voiceroom.connected$.subscribe((c) => {
        const wasConnected = this.connected;
        this.connected = c;
        if (!c) {
          this.expandedParticipantId = null;
          this.expandedScreenId = null;
          if (wasConnected) {
            void this.syncLobbyPresence(true);
          }
        }
      })
    );

    this.subs.add(
      this.voiceroom.maxParticipants$.subscribe((m) => (this.maxParticipants = m))
    );

    this.subs.add(
      this.voiceroom.audioPlaybackBlocked$.subscribe(
        (b) => (this.audioPlaybackBlocked = b)
      )
    );

    this.subs.add(
      this.voiceroom.error$.subscribe((msg) => {
        this.errorMessage = msg;
      })
    );

    this.subs.add(
      this.presence.subscribe((map) => {
        if (!this.channelId) return;
        const list = map[this.channelId] ?? [];
        this.lobbyPresence = list;
        this.voiceroom.mergePresence(list);
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    if (
      this.channelId &&
      !this.voiceroom.isConnectedTo(this.channelId)
    ) {
      this.presence.unwatch(this.channelId);
    }
  }

  private async switchChannel(nextId: string | null): Promise<void> {
    if (this.channelId && this.channelId !== nextId) {
      if (!this.voiceroom.isConnectedTo(this.channelId)) {
        this.presence.unwatch(this.channelId);
      }
    }
    this.channelId = nextId;
    if (this.channelId) {
      await this.initLobby();
    }
  }

  /** Disconnect LiveKit + socket presence but stay on this room (lobby). */
  private async leaveCall(): Promise<void> {
    const cid = this.channelId;
    if (!cid) return;
    await this.voiceroom.leave();
    this.connected = false;
    this.minimizedTrayHidden = false;
    await this.syncLobbyPresence(true);
  }


  private async syncLobbyPresence(forceFetch = false): Promise<void> {
    if (!this.channelId) return;
    try {
      if (forceFetch) {
        this.lobbyPresence = await this.presence.refresh(this.channelId);
      } else {
        this.lobbyPresence = this.presence.presenceFor(this.channelId);
        if (!this.lobbyPresence.length) {
          this.lobbyPresence = await this.presence.refresh(this.channelId);
        }
      }
      this.voiceroom.mergePresence(this.lobbyPresence);
    } catch {
      this.lobbyPresence = this.presence.presenceFor(this.channelId);
    }
  }

  private async initLobby(): Promise<void> {
    if (!this.channelId) return;
    this.loading = true;
    this.errorMessage = null;
    this.connected = this.voiceroom.isConnectedTo(this.channelId);
    try {
      this.channel = await firstValueFrom(
        this.channels.getChannel(this.channelId)
      );
      this.presence.watch(this.channelId);
      const res = await this.presence.fetchPresence(this.channelId);
      this.maxParticipants =
        res.maxParticipants ?? this.channel?.maxParticipants ?? 6;
      this.lobbyPresence = res.participants;
      this.voiceroom.mergePresence(res.participants);
    } catch (e) {
      const err = e as {
        error?: { message?: string };
        message?: string;
      };
      this.errorMessage =
        err?.error?.message ?? err?.message ?? 'Could not load voice room';
    } finally {
      this.loading = false;
    }
  }

  async joinVoice(): Promise<void> {
    if (!this.channelId || this.joining) return;
    if (this.voiceroom.isConnectedTo(this.channelId)) {
      this.connected = true;
      return;
    }
    this.joining = true;
    this.errorMessage = null;
    try {
      await this.voiceroom.join(
        this.channelId,
        this.channel?.name ?? undefined
      );
    } catch (e) {
      const err = e as {
        error?: { message?: string };
        message?: string;
        status?: number;
      };
      this.errorMessage =
        err?.error?.message ??
        err?.message ??
        (err?.status === 403 ? 'Voice room is full' : 'Could not join voice room');
    } finally {
      this.joining = false;
    }
  }

  async leaveCallAndStay(): Promise<void> {
    await this.leaveCall();
  }

  async leave(): Promise<void> {
    if (
      this.channelId &&
      !this.voiceroom.isConnectedTo(this.channelId)
    ) {
      this.presence.unwatch(this.channelId);
    }
    if (this.communityId) {
      await this.router.navigate([
        '/main/community',
        this.communityId,
        'about',
      ]);
    }
  }

  closeFullscreen(): void {
    this.expandedParticipantId = null;
    this.expandedScreenId = null;
    this.minimizedTrayHidden = false;
  }

  toggleMute(): void {
    void this.voiceroom.toggleMute();
  }

  toggleCamera(): void {
    void this.voiceroom.toggleCamera();
  }

  toggleScreen(): void {
    void this.voiceroom.toggleScreenShare();
  }

  enableAudio(): void {
    void this.voiceroom.enableAudioPlayback();
  }

  expandParticipant(p: IVoiceroomParticipantView): void {
    this.expandedScreenId = null;
    this.expandedParticipantId = p.identity;
    this.minimizedTrayHidden = false;
  }

  expandScreen(p: IVoiceroomParticipantView): void {
    if (!p.screenTrack) return;
    this.expandedParticipantId = null;
    this.expandedScreenId = p.identity;
    this.minimizedTrayHidden = false;
  }

  /** Screen tiles in fullscreen tray (all shares when a person is focused). */
  get fsTrayScreens(): IVoiceroomParticipantView[] {
    if (!this.isFullscreen) return [];
    if (this.expandedScreenId) {
      return this.screenShares.filter((p) => p.identity !== this.expandedScreenId);
    }
    return this.screenShares;
  }

  /** Participant tiles in fullscreen tray (everyone else when focused). */
  get fsTrayParticipants(): IVoiceroomParticipantView[] {
    if (!this.isFullscreen) return [];
    if (this.expandedParticipantId) {
      return this.participants.filter((p) => p.identity !== this.expandedParticipantId);
    }
    return this.participants;
  }

  get showMinimizedTray(): boolean {
    return (
      this.isFullscreen &&
      (this.fsTrayScreens.length > 0 || this.fsTrayParticipants.length > 0)
    );
  }

  get minimizedTrayCount(): number {
    return this.fsTrayScreens.length + this.fsTrayParticipants.length;
  }

  toggleMinimizedTray(): void {
    this.minimizedTrayHidden = !this.minimizedTrayHidden;
  }

  toggleGridScreenStrip(): void {
    this.gridScreenStripHidden = !this.gridScreenStripHidden;
  }

  toggleChatPanel(): void {
    this.chatPanelOpen = !this.chatPanelOpen;
  }

  initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  lobbyUserImage(u: IVoiceroomPresenceUser): string | null {
    return u.imageUrl?.trim() || null;
  }

  participantImage(p: IVoiceroomParticipantView): string | null {
    return p.imageUrl?.trim() || null;
  }
}
