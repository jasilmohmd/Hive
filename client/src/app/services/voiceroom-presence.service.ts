import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { Socket } from 'socket.io-client';
import { ChatService } from './chat.service';

export interface IVoiceroomPresenceUser {
  userId: string;
  userName: string;
  imageUrl?: string;
  muted: boolean;
  cameraOn: boolean;
  screenOn: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class VoiceroomPresenceService implements OnDestroy {
  private readonly byChannel$ = new BehaviorSubject<
    Record<string, IVoiceroomPresenceUser[]>
  >({});
  private readonly watched = new Set<string>();
  /** The socket instance our handlers are attached to (a new one after re-login). */
  private boundSocket: Socket | null = null;

  constructor(
    private http: HttpClient,
    private chat: ChatService
  ) {
    // Every (re)connect: attach handlers to a new socket instance, and re-send
    // room:watch — a reconnected socket is in no rooms server-side, so the
    // occupancy counts froze until the page was reloaded.
    this.chat.onSocketReady((socket) => {
      this.bindSocket(socket);
      for (const channelId of this.watched) {
        socket.emit('room:watch', { channelId });
      }
    });
    this.chat.sessionEnded$.subscribe(() => {
      this.watched.clear();
      this.boundSocket = null;
      this.byChannel$.next({});
    });
  }

  ngOnDestroy(): void {
    for (const id of this.watched) {
      this.unwatch(id);
    }
  }

  presenceFor(channelId: string): IVoiceroomPresenceUser[] {
    return this.byChannel$.value[channelId] ?? [];
  }

  count(channelId: string): number {
    return this.presenceFor(channelId).length;
  }

  watch(channelId: string): void {
    void this.watchInternal(channelId);
  }

  watchMany(channelIds: string[]): void {
    for (const id of channelIds) {
      if (id) void this.watchInternal(id);
    }
  }

  unwatch(channelId: string, clearCache = true): void {
    if (!this.watched.has(channelId)) return;
    this.watched.delete(channelId);
    try {
      this.chat.ensureSocket().emit('room:unwatch', { channelId });
    } catch {
      /* ignore */
    }
    if (clearCache) {
      const next = { ...this.byChannel$.value };
      delete next[channelId];
      this.byChannel$.next(next);
    }
  }

  subscribe(
    handler: (map: Record<string, IVoiceroomPresenceUser[]>) => void
  ): () => void {
    const sub = this.byChannel$.subscribe(handler);
    return () => sub.unsubscribe();
  }

  /** Force HTTP + socket watch refresh (e.g. after leaving a call). */
  async refresh(channelId: string): Promise<IVoiceroomPresenceUser[]> {
    const res = await this.fetchPresence(channelId);
    const socket = await this.chat.connectRealtime();
    this.bindSocket(socket);
    this.watched.add(channelId);
    socket.emit("room:watch", { channelId });
    return res.participants;
  }

  async fetchPresence(channelId: string): Promise<{
    participants: IVoiceroomPresenceUser[];
    maxParticipants: number;
  }> {
    const res = await firstValueFrom(
      this.http.get<{
        participants: IVoiceroomPresenceUser[];
        maxParticipants: number;
      }>(
        `${environment.apiUrl}/voiceroom/${encodeURIComponent(channelId)}/presence`,
        { withCredentials: true }
      )
    );
    const list = res.participants ?? [];
    this.patchChannel(channelId, list);
    return {
      participants: list,
      maxParticipants: res.maxParticipants ?? 6,
    };
  }

  private async watchInternal(channelId: string): Promise<void> {
    if (!this.watched.has(channelId)) {
      this.watched.add(channelId);
      await this.fetchPresence(channelId);
    }
    const socket = await this.chat.connectRealtime();
    this.bindSocket(socket);
    socket.emit("room:watch", { channelId });
  }

  private bindSocket(socket: Socket): void {
    if (this.boundSocket === socket) return;
    socket.on(
      'room:state',
      (payload: { channelId: string; participants: IVoiceroomPresenceUser[] }) => {
        if (!payload?.channelId) return;
        this.patchChannel(payload.channelId, payload.participants ?? []);
      }
    );
    this.boundSocket = socket;
  }

  private patchChannel(
    channelId: string,
    participants: IVoiceroomPresenceUser[]
  ): void {
    this.byChannel$.next({
      ...this.byChannel$.value,
      [channelId]: participants,
    });
  }
}
