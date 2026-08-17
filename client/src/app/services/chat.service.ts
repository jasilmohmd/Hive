import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, Subject, catchError, throwError } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { UserAuthService } from './user-auth.service';

export interface IMessageReplyTo {
  _id: string;
  content: string;
  type: string;
  sender?: string | { _id: string; userName: string; imageUrl?: string };
  deletedAt?: string;
}

export interface IReactionSummary {
  emoji: string;
  count: number;
  userIds: string[];
  reactedByMe: boolean;
}

export interface IPollSummary {
  question: string;
  options: string[];
  allowMultiple: boolean;
  counts: number[];
  myVotes: number[];
  totalVotes: number;
}

export interface IMessageMetadata {
  linkPreview?: {
    url: string;
    title?: string;
    description?: string;
    image?: string;
  };
  forwardedFrom?: {
    messageId: string;
    chatId: string;
    senderName: string;
  };
}

export interface IChatMessage {
  _id?: string;
  sender: string | { _id: string; userName: string; imageUrl?: string };
  chatId: string;
  content: string;
  type: string;
  timestamp: string;
  edited?: boolean;
  replyTo?: IMessageReplyTo;
  metadata?: string;
  reactions?: IReactionSummary[];
  poll?: IPollSummary;
}

export interface ISendMessageOptions {
  replyToMessageId?: string;
  metadata?: string;
}

type SocketReadyListener = (socket: Socket) => void;

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private readonly baseUrl = `${environment.apiUrl}/chat`;
  private socket: Socket | null = null;
  private readonly socketReadyListeners: SocketReadyListener[] = [];
  private connectPromise: Promise<Socket> | null = null;

  readonly incomingMessage$ = new Subject<IChatMessage>();
  readonly messageEdited$ = new Subject<IChatMessage>();
  readonly messageDeleted$ = new Subject<{ _id: string; chatId: string }>();
  readonly reactionUpdated$ = new Subject<{
    chatId: string;
    messageId: string;
    reactions: IReactionSummary[];
  }>();
  readonly pollUpdated$ = new Subject<{
    chatId: string;
    messageId: string;
    poll: IPollSummary;
  }>();
  readonly chatError$ = new Subject<string>();
  readonly socketConnected$ = new Subject<boolean>();

  constructor(
    private http: HttpClient,
    private auth: UserAuthService
  ) {}

  private handleError(error: HttpErrorResponse) {
    const errorMessage =
      error.error?.message || error.message || 'An unknown error occurred';
    return throwError(() => new Error(errorMessage));
  }

  getMessageHistory(chatId: string, page = 1, limit = 50): Observable<IChatMessage[]> {
    const url = `${this.baseUrl}/messages/${encodeURIComponent(chatId)}`;
    return this.http
      .get<IChatMessage[]>(url, { params: { page: String(page), limit: String(limit) } })
      .pipe(catchError(this.handleError));
  }

  sendImageMessage(chatId: string, file: File): Observable<IChatMessage> {
    return this.uploadChatFile(chatId, file, 'image');
  }

  sendVideoMessage(chatId: string, file: File): Observable<IChatMessage> {
    return this.uploadChatFile(chatId, file, 'video');
  }

  sendAudioMessage(chatId: string, file: File): Observable<IChatMessage> {
    return this.uploadChatFile(chatId, file, 'audio');
  }

  sendFileMessage(chatId: string, file: File): Observable<IChatMessage> {
    return this.uploadChatFile(chatId, file, 'file');
  }

  private uploadChatFile(
    chatId: string,
    file: File,
    kind: 'image' | 'video' | 'audio' | 'file'
  ): Observable<IChatMessage> {
    const url = `${this.baseUrl}/messages/${kind}`;
    const formData = new FormData();
    formData.append('chatId', chatId);
    formData.append('file', file);
    return this.http.post<IChatMessage>(url, formData).pipe(catchError(this.handleError));
  }

  editMessage(messageId: string, content: string): Observable<IChatMessage> {
    return this.http
      .patch<IChatMessage>(`${this.baseUrl}/messages/${messageId}`, { content })
      .pipe(catchError(this.handleError));
  }

  deleteMessage(messageId: string): Observable<{ _id: string }> {
    return this.http
      .delete<{ _id: string }>(`${this.baseUrl}/messages/${messageId}`)
      .pipe(catchError(this.handleError));
  }

  setReaction(messageId: string, emoji: string): Observable<unknown> {
    return this.http
      .post(`${this.baseUrl}/messages/${messageId}/reactions`, { emoji })
      .pipe(catchError(this.handleError));
  }

  removeReaction(messageId: string): Observable<unknown> {
    return this.http
      .delete(`${this.baseUrl}/messages/${messageId}/reactions`)
      .pipe(catchError(this.handleError));
  }

  votePoll(messageId: string, optionIndexes: number[]): Observable<unknown> {
    return this.http
      .post(`${this.baseUrl}/messages/${messageId}/vote`, { optionIndexes })
      .pipe(catchError(this.handleError));
  }

  static directChatId(userIdA: string, userIdB: string): string {
    return [userIdA, userIdB].sort().join('_');
  }

  isSocketConnected(): boolean {
    return !!this.socket?.connected;
  }

  onSocketReady(listener: SocketReadyListener): void {
    this.socketReadyListeners.push(listener);
    if (this.socket?.connected) {
      listener(this.socket);
    }
  }

  private notifySocketReady(): void {
    if (!this.socket) return;
    for (const listener of this.socketReadyListeners) {
      listener(this.socket);
    }
  }

  private resolveSocketUrl(): string {
    const configured = environment.socketUrl?.trim();
    if (configured) return configured;
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return environment.apiUrl;
  }

  /**
   * Connect Socket.IO with a fresh JWT from GET /auth/realtime-token.
   * Call once after login when entering /main.
   */
  connectRealtime(): Promise<Socket> {
    if (this.socket?.connected) {
      return Promise.resolve(this.socket);
    }
    if (this.connectPromise) {
      return this.connectPromise;
    }
    this.connectPromise = this.doConnectRealtime().finally(() => {
      this.connectPromise = null;
    });
    return this.connectPromise;
  }

  private async doConnectRealtime(): Promise<Socket> {
    const token = await this.auth.fetchRealtimeToken();
    if (this.socket) {
      this.socket.auth = { token };
      if (!this.socket.connected) {
        this.socket.connect();
      }
      await this.waitUntilConnected(this.socket);
      return this.socket;
    }

    const socket = io(this.resolveSocketUrl(), {
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
    });

    this.attachSocketHandlers(socket);
    await this.waitUntilConnected(socket);
    this.socket = socket;
    return socket;
  }

  private attachSocketHandlers(socket: Socket): void {
    socket.on('newMessage', (msg: IChatMessage) => {
      this.incomingMessage$.next(msg);
    });

    socket.on('messageEdited', (msg: IChatMessage) => {
      this.messageEdited$.next(msg);
    });

    socket.on('messageDeleted', (payload: { _id: string; chatId: string }) => {
      this.messageDeleted$.next(payload);
    });

    socket.on(
      'reactionUpdated',
      (payload: { chatId: string; messageId: string; reactions: IReactionSummary[] }) => {
        this.reactionUpdated$.next(payload);
      }
    );

    socket.on(
      'pollUpdated',
      (payload: { chatId: string; messageId: string; poll: IPollSummary }) => {
        this.pollUpdated$.next(payload);
      }
    );

    socket.on('chatError', (payload: { message?: string }) => {
      this.chatError$.next(payload?.message ?? 'Chat error');
    });

    socket.on('connect', () => {
      this.socketConnected$.next(true);
      this.notifySocketReady();
    });

    socket.on('disconnect', () => {
      this.socketConnected$.next(false);
    });

    socket.on('connect_error', (err: Error) => {
      this.socketConnected$.next(false);
      const msg =
        err?.message ||
        'Realtime connection failed — restart client (npm run client) so proxy.conf.json loads';
      this.chatError$.next(msg);
    });
  }

  private waitUntilConnected(socket: Socket): Promise<void> {
    if (socket.connected) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Realtime connection timed out'));
      }, 15000);
      const onConnect = () => {
        cleanup();
        resolve();
      };
      const onError = (err: Error) => {
        cleanup();
        reject(err ?? new Error('Realtime connection failed'));
      };
      const cleanup = () => {
        clearTimeout(timeout);
        socket.off('connect', onConnect);
        socket.off('connect_error', onError);
      };
      socket.on('connect', onConnect);
      socket.on('connect_error', onError);
    });
  }

  ensureSocket(): Socket {
    if (!this.socket) {
      throw new Error('Realtime not connected. Open the app from /main first.');
    }
    return this.socket;
  }

  async ensureSocketConnected(): Promise<Socket> {
    if (this.socket?.connected) {
      return this.socket;
    }
    return this.connectRealtime();
  }

  joinChat(chatId: string): void {
    const s = this.ensureSocket();
    s.emit('joinChat', chatId);
  }

  sendMessage(chatId: string, content: string, type = 'text', options?: ISendMessageOptions): void {
    const s = this.ensureSocket();
    s.emit('sendMessage', {
      chatId,
      content,
      type,
      replyToMessageId: options?.replyToMessageId,
      metadata: options?.metadata,
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.socketConnected$.next(false);
  }
}
