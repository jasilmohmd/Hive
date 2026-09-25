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

import { Socket } from 'socket.io-client';

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

  /** The socket instance our room:* handlers are attached to (a new one after re-login). */
  private boundSocket: Socket | null = null;

  /** Mic state to restore when deafen is turned back off. */
  private mutedBeforeDeafen = false;

  private readonly presenceByUserId = new Map<string, IVoiceroomPresenceUser>();

  private readonly livekitUrl = environment.livekitUrl?.trim() || '';



  readonly participants$ = new BehaviorSubject<IVoiceroomParticipantView[]>([]);

  readonly presence$ = new BehaviorSubject<IVoiceroomPresenceUser[]>([]);

  readonly error$ = new Subject<string>();

  readonly connected$ = new BehaviorSubject(false);

  readonly maxParticipants$ = new BehaviorSubject(6);

  readonly audioPlaybackBlocked$ = new BehaviorSubject(false);

  readonly activeChannelName$ = new BehaviorSubject<string | null>(null);

  /** Community the active room belongs to — the session bar links back to it after you switch communities. */
  readonly activeCommunityId$ = new BehaviorSubject<string | null>(null);

  /**
   * Streams, so every control showing mute/deafen (the room dock, the sidebar
   * session bar, the sidebar user panel) stays in sync. The session bar used
   * to read the plain field once and showed a stale icon after muting from
   * the dock.
   */
  readonly localMuted$ = new BehaviorSubject(false);

  /** Deafened: remote audio is silenced locally (and the mic muted, as in most voice apps). */
  readonly deafened$ = new BehaviorSubject(false);

  get localMuted(): boolean {
    return this.localMuted$.value;
  }

  set localMuted(value: boolean) {
    if (value !== this.localMuted$.value) this.localMuted$.next(value);
  }

  get deafened(): boolean {
    return this.deafened$.value;
  }

  localCamOn = false;

  localScreenOn = false;

  localImageUrl: string | null = null;



  constructor(

    private http: HttpClient,

    private chat: ChatService

  ) {
    // A reconnected socket is a new socket server-side, in no rooms: re-announce
    // the room we're in so others keep seeing us, and re-attach handlers when
    // it's a new instance (logout → login in the same tab).
    this.chat.onSocketReady((socket) => {
      this.bindSocket(socket);
      if (this.presenceJoinedChannelId && this.isConnected) {
        socket.emit('room:join', { channelId: this.presenceJoinedChannelId, muted: this.localMuted });
        this.emitMediaPresence();
      }
    });
    this.chat.sessionEnded$.subscribe(() => {
      this.boundSocket = null;
      void this.leaveActiveCall();
    });
  }

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
    this.activeCommunityId$.next(null);
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



  async join(channelId: string, channelName?: string, communityId?: string): Promise<void> {
    await this.leave();
    this.channelId = channelId;
    this.activeChannelName$.next(channelName?.trim() || null);
    this.activeCommunityId$.next(communityId || null);



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



    try {
      await room.connect(url, tokenRes.token);
      await room.localParticipant.setMicrophoneEnabled(true);
    } catch (err) {
      // Without this, a mic failure (NotReadableError when another app holds
      // it) left the LiveKit room connected: everyone else saw a ghost
      // participant while this client showed "not connected".
      await room.disconnect().catch(() => undefined);
      if (this.room === room) this.room = null;
      this.channelId = null;
      this.activeChannelName$.next(null);
      this.activeCommunityId$.next(null);
      throw err;
    }

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
    this.deafened$.next(false);
    this.mutedBeforeDeafen = false;
    this.localCamOn = false;
    this.localScreenOn = false;
    this.channelId = null;
    this.activeChannelName$.next(null);
    this.activeCommunityId$.next(null);
  }

  async toggleMute(): Promise<void> {
    if (!this.room) return;
    // Unmuting while deafened undeafens too — talking into a room you can't
    // hear is never what anyone wants.
    if (this.deafened && this.localMuted) {
      this.deafened$.next(false);
    }
    await this.setMuted(!this.localMuted);
  }

  /**
   * Silence every remote participant for this client only, and mute the mic
   * with it. Turning it off restores the mic to whatever it was before.
   * The actual audio muting happens where the <audio> elements live
   * (VoiceroomAudioComponent), which reads deafened$.
   */
  async toggleDeafen(): Promise<void> {
    if (!this.room) return;
    const next = !this.deafened;
    if (next) {
      this.mutedBeforeDeafen = this.localMuted;
      this.deafened$.next(true);
      if (!this.localMuted) await this.setMuted(true);
    } else {
      this.deafened$.next(false);
      if (!this.mutedBeforeDeafen && this.localMuted) await this.setMuted(false);
    }
  }

  private async setMuted(muted: boolean): Promise<void> {
    if (!this.room) return;
    this.localMuted = muted;
    await this.room.localParticipant.setMicrophoneEnabled(!muted);
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
    this.bindSocket(socket);
    socket.emit('room:join', {
      channelId,
      muted: this.localMuted,
    });
    this.presenceJoinedChannelId = channelId;
  }

  private bindSocket(socket: Socket): void {

    if (this.boundSocket !== socket) {

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

      this.boundSocket = socket;

    }

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

