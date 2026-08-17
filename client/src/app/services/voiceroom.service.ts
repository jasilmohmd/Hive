import { Injectable, OnDestroy } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import {

  Room,

  RoomEvent,

  Track,

  LocalParticipant,

  RemoteParticipant,

  LocalTrack,

  RemoteTrack,

} from 'livekit-client';

import { BehaviorSubject, Subject, firstValueFrom } from 'rxjs';

import { environment } from '../../environments/environment';

import { ChatService } from './chat.service';

import { IVoiceroomPresenceUser } from './voiceroom-presence.service';



export type VoiceroomMediaTrack = LocalTrack | RemoteTrack;



export interface IVoiceroomParticipantView {

  identity: string;

  name: string;

  imageUrl?: string;

  isLocal: boolean;

  isSpeaking: boolean;

  muted: boolean;

  cameraOn: boolean;

  screenOn: boolean;

  audioTrack: VoiceroomMediaTrack | null;

  cameraTrack: VoiceroomMediaTrack | null;

  screenTrack: VoiceroomMediaTrack | null;

}



@Injectable({

  providedIn: 'root',

})

export class VoiceroomService implements OnDestroy {

  private room: Room | null = null;

  private channelId: string | null = null;

  private presenceJoinedChannelId: string | null = null;

  private presenceBound = false;

  private readonly presenceByUserId = new Map<string, IVoiceroomPresenceUser>();

  private readonly livekitUrl = environment.livekitUrl?.trim() || '';



  readonly participants$ = new BehaviorSubject<IVoiceroomParticipantView[]>([]);

  readonly presence$ = new BehaviorSubject<IVoiceroomPresenceUser[]>([]);

  readonly error$ = new Subject<string>();

  readonly connected$ = new BehaviorSubject(false);

  readonly maxParticipants$ = new BehaviorSubject(6);

  readonly audioPlaybackBlocked$ = new BehaviorSubject(false);

  readonly activeChannelName$ = new BehaviorSubject<string | null>(null);

  localMuted = false;

  localCamOn = false;

  localScreenOn = false;

  localImageUrl: string | null = null;



  constructor(

    private http: HttpClient,

    private chat: ChatService

  ) {}

  get isConnected(): boolean {
    return this.connected$.value;
  }

  get activeChannelId(): string | null {
    return this.isConnected ? this.channelId : null;
  }

  isConnectedTo(channelId: string): boolean {
    return this.isConnected && this.channelId === channelId;
  }

  ngOnDestroy(): void {

    void this.leave();

    this.dispose();

  }

  dispose(): void {
    this.channelId = null;
    this.presenceJoinedChannelId = null;
    this.activeChannelName$.next(null);
  }

  async leaveActiveCall(): Promise<void> {
    await this.leave();
    this.dispose();
  }



  setLocalProfile(imageUrl: string | null | undefined): void {

    this.localImageUrl = imageUrl?.trim() || null;

    this.refreshParticipants();

  }



  mergePresence(users: IVoiceroomPresenceUser[]): void {

    this.presenceByUserId.clear();

    for (const u of users) {

      this.presenceByUserId.set(u.userId, u);

    }

    this.presence$.next(users);

    this.refreshParticipants();

  }



  async join(channelId: string, channelName?: string): Promise<void> {
    await this.leave();
    this.channelId = channelId;
    this.activeChannelName$.next(channelName?.trim() || null);



    const tokenRes = await firstValueFrom(

      this.http.post<{

        token: string;

        livekitUrl: string;

        maxParticipants: number;

      }>(

        `${environment.apiUrl}/voiceroom/${encodeURIComponent(channelId)}/token`,

        {},

        { withCredentials: true }

      )

    );



    const url = tokenRes.livekitUrl || this.livekitUrl;

    if (!url) {

      throw new Error('LiveKit URL is not configured');

    }



    this.maxParticipants$.next(tokenRes.maxParticipants);



    const room = new Room({ adaptiveStream: true, dynacast: true });

    this.room = room;



    const refresh = () => this.refreshParticipants();

    room.on(RoomEvent.TrackSubscribed, refresh);

    room.on(RoomEvent.TrackUnsubscribed, refresh);

    room.on(RoomEvent.LocalTrackPublished, refresh);

    room.on(RoomEvent.LocalTrackUnpublished, refresh);

    room.on(RoomEvent.ParticipantConnected, refresh);

    room.on(RoomEvent.ParticipantDisconnected, refresh);

    room.on(RoomEvent.ActiveSpeakersChanged, refresh);

    room.on(RoomEvent.AudioPlaybackStatusChanged, () => {

      this.audioPlaybackBlocked$.next(!room.canPlaybackAudio);

    });

    room.on(RoomEvent.Disconnected, () => {

      this.connected$.next(false);

      this.participants$.next([]);

      this.audioPlaybackBlocked$.next(false);

    });



    await room.connect(url, tokenRes.token);

    await room.localParticipant.setMicrophoneEnabled(true);

    this.connected$.next(true);

    await this.tryStartAudio(room);



    await this.bindPresence(channelId);

    this.emitMediaPresence();

    this.refreshParticipants();

  }



  async leave(): Promise<void> {

    const presenceCid = this.presenceJoinedChannelId;

    if (presenceCid) {

      try {

        const socket = await this.chat.connectRealtime();

        await new Promise<void>((resolve) => {

          socket.emit('room:leave', { channelId: presenceCid }, () => resolve());

          window.setTimeout(resolve, 400);

        });

      } catch {

        /* ignore */

      }

      this.presenceJoinedChannelId = null;

    }

    if (this.room) {

      await this.room.disconnect();

      this.room = null;

    }

    this.connected$.next(false);

    this.participants$.next([]);

    this.localMuted = false;
    this.localCamOn = false;
    this.localScreenOn = false;
    this.channelId = null;
    this.activeChannelName$.next(null);
  }

  async toggleMute(): Promise<void> {

    if (!this.room) return;

    this.localMuted = !this.localMuted;

    await this.room.localParticipant.setMicrophoneEnabled(!this.localMuted);

    this.emitMutePresence();

    this.refreshParticipants();

  }



  async toggleCamera(): Promise<void> {

    if (!this.room) return;

    this.localCamOn = !this.localCamOn;

    await this.room.localParticipant.setCameraEnabled(this.localCamOn);

    this.emitMediaPresence();

    this.refreshParticipants();

  }



  async toggleScreenShare(): Promise<void> {

    if (!this.room) return;

    this.localScreenOn = !this.localScreenOn;

    await this.room.localParticipant.setScreenShareEnabled(this.localScreenOn);

    this.emitMediaPresence();

    this.refreshParticipants();

  }



  async enableAudioPlayback(): Promise<void> {

    if (!this.room) return;

    await this.tryStartAudio(this.room);

  }



  private async tryStartAudio(room: Room): Promise<void> {

    try {

      await room.startAudio();

      this.audioPlaybackBlocked$.next(!room.canPlaybackAudio);

    } catch {

      this.audioPlaybackBlocked$.next(true);

    }

  }



  private async bindPresence(channelId: string): Promise<void> {

    const socket = await this.chat.connectRealtime();

    if (!this.presenceBound) {

      socket.on(

        'room:state',

        (payload: {

          channelId: string;

          participants: IVoiceroomPresenceUser[];

        }) => {

          if (payload.channelId === this.channelId) {

            this.mergePresence(payload.participants ?? []);

          }

        }

      );

      socket.on('room:error', (payload: { message?: string }) => {

        this.error$.next(payload?.message ?? 'Room error');

      });

      this.presenceBound = true;

    }

    socket.emit('room:join', {

      channelId,

      muted: this.localMuted,

    });

    this.presenceJoinedChannelId = channelId;

  }



  private emitMutePresence(): void {

    if (!this.channelId) return;

    try {

      this.chat.ensureSocket().emit('room:mute', {

        channelId: this.channelId,

        muted: this.localMuted,

      });

    } catch {

      /* ignore */

    }

  }



  private emitMediaPresence(): void {

    if (!this.channelId) return;

    try {

      this.chat.ensureSocket().emit('room:media', {

        channelId: this.channelId,

        cameraOn: this.localCamOn,

        screenOn: this.localScreenOn,

      });

    } catch {

      /* ignore */

    }

  }



  private refreshParticipants(): void {

    const room = this.room;

    if (!room) {

      this.participants$.next([]);

      return;

    }

    const speakers = new Set(room.activeSpeakers.map((p) => p.identity));

    const views: IVoiceroomParticipantView[] = [];



    const addParticipant = (

      p: LocalParticipant | RemoteParticipant,

      isLocal: boolean

    ) => {

      let audioTrack: VoiceroomMediaTrack | null = null;

      let cameraTrack: VoiceroomMediaTrack | null = null;

      let screenTrack: VoiceroomMediaTrack | null = null;



      p.trackPublications.forEach((pub) => {

        const track = pub.track;

        if (!track) return;

        if (pub.source === Track.Source.Microphone) {

          audioTrack = track;

        } else if (pub.source === Track.Source.Camera) {

          cameraTrack = track;

        } else if (pub.source === Track.Source.ScreenShare) {

          screenTrack = track;

        }

      });



      const audioPub = p.getTrackPublication(Track.Source.Microphone);

      const pres = this.presenceByUserId.get(p.identity);

      const muted = isLocal

        ? this.localMuted

        : !(audioPub?.track && !audioPub.isMuted);

      const cameraOn = isLocal

        ? this.localCamOn

        : (pres?.cameraOn ?? !!cameraTrack);

      const screenOn = isLocal

        ? this.localScreenOn

        : (pres?.screenOn ?? !!screenTrack);



      views.push({

        identity: p.identity,

        name: p.name || p.identity,

        imageUrl: isLocal

          ? this.localImageUrl ?? pres?.imageUrl

          : pres?.imageUrl,

        isLocal,

        isSpeaking: speakers.has(p.identity),

        muted,

        cameraOn,

        screenOn,

        audioTrack,

        cameraTrack,

        screenTrack,

      });

    };



    addParticipant(room.localParticipant, true);

    room.remoteParticipants.forEach((p) => addParticipant(p, false));

    this.participants$.next(views);

  }

}

