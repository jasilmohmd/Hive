import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subject, firstValueFrom } from 'rxjs';
import { Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { ChatService } from './chat.service';
import { CallRingtoneService } from './call-ringtone.service';
import { P2pTransport } from './call/p2p-transport';

export type CallType = 'audio' | 'video';
export type CallState =
  | 'idle'
  | 'outgoing'
  | 'incoming'
  | 'connecting'
  | 'active'
  | 'unavailable'
  | 'ended';

export interface IIncomingCall {
  callId: string;
  chatId: string;
  callType: CallType;
  callerId: string;
}

const DEFAULT_ICE: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

@Injectable({
  providedIn: 'root',
})
export class CallService {
  private readonly transport = new P2pTransport();
  private iceConfig: RTCConfiguration | null = null;
  private callId: string | null = null;
  private chatId: string | null = null;
  private peerId: string | null = null;
  private role: 'caller' | 'callee' | null = null;
  private callType: CallType = 'audio';
  private socketListenersBound = false;
  private unavailableDismissTimer: ReturnType<typeof setTimeout> | null = null;

  readonly incomingCall$ = new Subject<IIncomingCall>();
  readonly callAccepted$ = new Subject<{ callId: string; chatId: string }>();
  readonly callEnded$ = new Subject<{ callId: string; chatId: string; endedBy?: string }>();
  readonly callRejected$ = new Subject<{ callId: string; chatId: string }>();
  readonly remoteStream$ = this.transport.remoteStream$;
  readonly callError$ = new Subject<string>();
  readonly callState$ = new BehaviorSubject<CallState>('idle');
  readonly callType$ = new BehaviorSubject<CallType>('audio');

  constructor(
    private chat: ChatService,
    private ringtone: CallRingtoneService,
    private http: HttpClient
  ) {
    this.chat.onSocketReady((socket) => this.bindSocketEventsIfNeeded(socket));
    this.callState$.subscribe((state) => {
      if (state === 'outgoing') this.ringtone.playOutgoing();
      else if (state === 'incoming') this.ringtone.playIncoming();
      else if (state !== 'unavailable') this.ringtone.stop();
    });
    this.transport.remoteStream$.subscribe((stream) => {
      if (stream && this.callState$.value === 'connecting') {
        this.callState$.next('active');
      }
    });
  }

  async connect(): Promise<void> {
    const socket = await this.chat.connectRealtime();
    this.bindSocketEventsIfNeeded(socket);
  }

  private bindSocketEventsIfNeeded(socket: Socket): void {
    if (this.socketListenersBound) return;
    this.bindSocketEvents(socket);
    this.socketListenersBound = true;
  }

  get activeCallId(): string | null {
    return this.callId;
  }

  get activeChatId(): string | null {
    return this.chatId;
  }

  get activeCallType(): CallType {
    return this.callType;
  }

  get localMediaStream(): MediaStream | null {
    return this.transport.localStream;
  }

  isInCall(): boolean {
    const s = this.callState$.value;
    return s === 'outgoing' || s === 'incoming' || s === 'connecting' || s === 'active';
  }

  releaseMediaDevices(): void {
    this.transport.releaseLocalMedia();
  }

  async startCall(chatId: string, peerId: string, callType: CallType): Promise<void> {
    try {
      await this.connect();
      if (this.isInCall()) {
        this.callError$.next('Already in a call');
        return;
      }
      this.resetCallMedia();
      this.callId = crypto.randomUUID();
      this.chatId = chatId;
      this.peerId = peerId;
      this.role = 'caller';
      this.callType = callType;
      this.callType$.next(callType);
      this.callState$.next('outgoing');

      await this.transport.acquireLocalMedia(callType);
      const socket = await this.chat.connectRealtime();
      socket.emit('call:invite', {
        callId: this.callId,
        chatId,
        callType,
      });
    } catch (e) {
      this.callError$.next((e as Error).message);
      this.endCallLocal();
      throw e;
    }
  }

  async acceptCall(incoming?: IIncomingCall): Promise<void> {
    await this.connect();
    const call = incoming ?? this.getPendingIncoming();
    if (!call) return;

    this.callId = call.callId;
    this.chatId = call.chatId;
    this.peerId = call.callerId;
    this.role = 'callee';
    this.callType = call.callType;
    this.callType$.next(call.callType);
    this.callState$.next('connecting');

    try {
      await this.transport.acquireLocalMedia(call.callType);
      const socket = await this.chat.connectRealtime();
      socket.emit('call:accept', {
        callId: call.callId,
        chatId: call.chatId,
      });
    } catch (e) {
      this.callError$.next((e as Error).message);
      this.abortCallSetup();
    }
  }

  rejectCall(): void {
    if (!this.callId || !this.chatId) {
      this.callState$.next('idle');
      return;
    }
    this.chat.ensureSocket().emit('call:reject', {
      callId: this.callId,
      chatId: this.chatId,
    });
    this.endCallLocal();
  }

  endCall(): void {
    if (this.callId && this.chatId && this.isInCall()) {
      this.chat.ensureSocket().emit('call:end', {
        callId: this.callId,
        chatId: this.chatId,
      });
    }
    this.endCallLocal();
  }

  private abortCallSetup(): void {
    this.endCall();
  }

  toggleMute(): boolean {
    return this.transport.toggleMic();
  }

  toggleCamera(): boolean {
    return this.transport.toggleCam();
  }

  private getPendingIncoming(): IIncomingCall | null {
    if (this.callState$.value !== 'incoming' || !this.callId || !this.chatId || !this.peerId) {
      return null;
    }
    return {
      callId: this.callId,
      chatId: this.chatId,
      callType: this.callType,
      callerId: this.peerId,
    };
  }

  private bindSocketEvents(socket: Socket): void {
    socket.on('call:incoming', (payload: IIncomingCall) => {
      if (this.isInCall() && this.callState$.value !== 'incoming') return;
      this.callId = payload.callId;
      this.chatId = payload.chatId;
      this.peerId = payload.callerId;
      this.callType = payload.callType;
      this.callType$.next(payload.callType);
      this.role = 'callee';
      this.callState$.next('incoming');
      this.incomingCall$.next(payload);
    });

    socket.on('call:ringing', (payload: { callId: string }) => {
      if (payload.callId === this.callId && this.role === 'caller') {
        this.callState$.next('outgoing');
      }
    });

    socket.on('call:accepted', async (payload: { callId: string; chatId: string }) => {
      if (payload.callId !== this.callId) return;
      try {
        this.callState$.next('connecting');
        this.callAccepted$.next(payload);
        if (this.role === 'caller') {
          await this.createAndSendOffer();
        }
      } catch (e) {
        this.callError$.next((e as Error).message);
        this.endCall();
      }
    });

    socket.on('call:rejected', (payload: { callId: string; chatId: string }) => {
      if (payload.callId !== this.callId) return;
      this.callRejected$.next(payload);
      this.callError$.next('Call declined');
      this.endCallLocal();
    });

    socket.on('call:ended', (payload: { callId: string; chatId: string; endedBy?: string }) => {
      if (payload.callId !== this.callId) return;
      this.callEnded$.next(payload);
      this.endCallLocal();
    });

    socket.on('call:busy', (payload: { callId?: string }) => {
      if (payload?.callId && payload.callId !== this.callId) return;
      this.callError$.next('User is busy');
      this.endCallLocal();
    });

    socket.on('call:unavailable', (payload: { callId?: string }) => {
      if (payload?.callId && payload.callId !== this.callId) return;
      this.handlePeerUnavailable();
    });

    socket.on('call:error', (payload: { message?: string }) => {
      this.callError$.next(payload?.message ?? 'Call error');
      this.endCallLocal();
    });

    socket.on('call:offer', async (payload: { callId: string; sdp: RTCSessionDescriptionInit }) => {
      if (payload.callId !== this.callId) return;
      try {
        await this.handleOffer(payload.sdp);
      } catch (e) {
        this.callError$.next((e as Error).message);
        this.endCall();
      }
    });

    socket.on('call:answer', async (payload: { callId: string; sdp: RTCSessionDescriptionInit }) => {
      if (payload.callId !== this.callId) return;
      try {
        await this.handleAnswer(payload.sdp);
      } catch (e) {
        this.callError$.next((e as Error).message);
        this.endCall();
      }
    });

    socket.on(
      'call:ice-candidate',
      async (payload: { callId: string; candidate: RTCIceCandidateInit }) => {
        if (payload.callId !== this.callId) return;
        await this.transport.addIceCandidate(payload.candidate);
      }
    );
  }

  private async getIceServers(): Promise<RTCConfiguration> {
    if (this.iceConfig) return this.iceConfig;
    try {
      const res = await firstValueFrom(
        this.http.get<{ iceServers: RTCIceServer[] }>(`${environment.apiUrl}/call/ice-config`, {
          withCredentials: true,
        })
      );
      this.iceConfig = { iceServers: res.iceServers ?? DEFAULT_ICE.iceServers };
    } catch {
      this.iceConfig = DEFAULT_ICE;
    }
    return this.iceConfig;
  }

  private bindTransportSignaling(): void {
    this.transport.bindSignalingHandlers({
      callType: this.callType,
      onIceCandidate: (candidate) => {
        if (this.callId) {
          this.chat.ensureSocket().emit('call:ice-candidate', {
            callId: this.callId,
            candidate,
          });
        }
      },
      onConnectionFailed: () => {
        this.callError$.next('Connection failed');
        this.endCall();
      },
    });
  }

  private async createAndSendOffer(): Promise<void> {
    const ice = await this.getIceServers();
    this.bindTransportSignaling();
    this.transport.createPeerConnection(ice);
    const offer = await this.transport.createOffer();
    const socket = await this.chat.connectRealtime();
    socket.emit('call:offer', {
      callId: this.callId,
      sdp: offer,
    });
  }

  private async handleOffer(sdp: RTCSessionDescriptionInit): Promise<void> {
    const ice = await this.getIceServers();
    this.bindTransportSignaling();
    this.transport.createPeerConnection(ice);
    const answer = await this.transport.handleOffer(sdp);
    const socket = await this.chat.connectRealtime();
    socket.emit('call:answer', {
      callId: this.callId,
      sdp: answer,
    });
  }

  private async handleAnswer(sdp: RTCSessionDescriptionInit): Promise<void> {
    await this.transport.handleAnswer(sdp);
    this.callState$.next('active');
  }

  private resetCallMedia(): void {
    this.transport.releaseLocalMedia();
  }

  private handlePeerUnavailable(): void {
    this.clearUnavailableDismissTimer();
    this.ringtone.stop();
    this.transport.releaseLocalMedia();
    this.callState$.next('unavailable');
    this.unavailableDismissTimer = setTimeout(() => {
      if (this.callState$.value === 'unavailable') {
        this.endCallLocal();
      }
    }, 4000);
  }

  private clearUnavailableDismissTimer(): void {
    if (this.unavailableDismissTimer) {
      clearTimeout(this.unavailableDismissTimer);
      this.unavailableDismissTimer = null;
    }
  }

  private endCallLocal(): void {
    this.clearUnavailableDismissTimer();
    this.ringtone.stop();
    this.transport.releaseLocalMedia();
    this.callId = null;
    this.chatId = null;
    this.peerId = null;
    this.role = null;
    this.callState$.next('idle');
  }
}
