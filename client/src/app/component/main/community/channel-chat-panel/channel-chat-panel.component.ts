import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  firstValueFrom,
  forkJoin,
  map,
  of,
  Subscription,
} from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ChatService, IChatMessage } from '../../../../services/chat.service';
import { UserAuthService } from '../../../../services/user-auth.service';
import { FriendService } from '../../../../services/friends.service';
import {
  ChatComposerComponent,
  ChatComposerPayload,
} from '../../../common/chat-composer/chat-composer.component';
import { LoadingStateComponent } from '../../../common/loading-state/loading-state.component';
import { ErrorAlertComponent } from '../../../common/error-alert/error-alert.component';
import { EmptyStateComponent } from '../../../common/empty-state/empty-state.component';
import { ChatMediaComponent } from '../../../common/chat-media/chat-media.component';
import { ChatGifPickerComponent } from '../../../common/chat-gif-picker/chat-gif-picker.component';
import { ChatAttachMenuComponent } from '../../../common/chat-attach-menu/chat-attach-menu.component';
import { ChatMediaPickerComponent } from '../../../common/chat-media-picker/chat-media-picker.component';
import { ChatLocationPickerComponent } from '../../../common/chat-location-picker/chat-location-picker.component';
import { ChatMessageVideoComponent } from '../../../common/chat-message-video/chat-message-video.component';
import { ChatMessageFileComponent } from '../../../common/chat-message-file/chat-message-file.component';
import { ChatMessageLocationComponent } from '../../../common/chat-message-location/chat-message-location.component';
import { chatSenderColors, chatSenderMessageBubbleStyle } from '../../../../util/chat-sender-color';
import {
  ChatUploadKind,
  validateFileForUpload,
} from '../../../../util/chat-attachment';
import {
  closeAllAttachPanels,
  clearPendingAttach,
  onAttachFileChosen,
  sendLocationMessage,
  triggerFileInput,
  uploadComposerFile,
} from '../../../../util/chat-attachment-host';
import {
  IFileMessageContent,
  ILocationMessageContent,
  isFileMessage,
  isGifMessage,
  isImageMessage,
  isLocationMessage,
  isStickerMessage,
  isVideoMessage,
  parseFileContent,
  parseLocationContent,
  isAudioMessage,
  isContactMessage,
  isPollMessage,
  parseContactContent,
  parseMetadata,
  replyPreviewText,
  hasForwardedLabel,
} from '../../../../util/message-display';
import { ChatMessageAudioComponent } from '../../../common/chat-message-audio/chat-message-audio.component';
import { ChatMessageReplyComponent } from '../../../common/chat-message-reply/chat-message-reply.component';
import { ChatLinkPreviewComponent } from '../../../common/chat-link-preview/chat-link-preview.component';
import { ChatMessageContactComponent } from '../../../common/chat-message-contact/chat-message-contact.component';
import { ChatMessagePollComponent } from '../../../common/chat-message-poll/chat-message-poll.component';
import { ChatMessageReactionsComponent } from '../../../common/chat-message-reactions/chat-message-reactions.component';
import { ChatMessageContextMenuComponent } from '../../../common/chat-message-context-menu/chat-message-context-menu.component';
import { ChatVoiceRecorderComponent } from '../../../common/chat-voice-recorder/chat-voice-recorder.component';
import { ChatPollComposerComponent } from '../../../common/chat-poll-composer/chat-poll-composer.component';
import { ChatContactPickerComponent } from '../../../common/chat-contact-picker/chat-contact-picker.component';
import { ChatForwardPickerComponent } from '../../../common/chat-forward-picker/chat-forward-picker.component';
import {
  applyMessageDeleted,
  applyMessageEdited,
  applyPollUpdated,
  applyReactionUpdated,
  forwardMessageToChat,
} from '../../../../util/chat-message-actions';
import { IUser } from '../../../../services/friends.service';

@Component({
  selector: 'app-channel-chat-panel',
  standalone: true,
  imports: [
    CommonModule,
    ChatComposerComponent,
    LoadingStateComponent,
    ErrorAlertComponent,
    EmptyStateComponent,
    ChatMediaComponent,
    ChatGifPickerComponent,
    ChatAttachMenuComponent,
    ChatMediaPickerComponent,
    ChatLocationPickerComponent,
    ChatMessageVideoComponent,
    ChatMessageFileComponent,
    ChatMessageLocationComponent,
    ChatMessageAudioComponent,
    ChatMessageReplyComponent,
    ChatLinkPreviewComponent,
    ChatMessageContactComponent,
    ChatMessagePollComponent,
    ChatMessageReactionsComponent,
    ChatMessageContextMenuComponent,
    ChatVoiceRecorderComponent,
    ChatPollComposerComponent,
    ChatContactPickerComponent,
    ChatForwardPickerComponent,
  ],
  templateUrl: './channel-chat-panel.component.html',
  styleUrl: './channel-chat-panel.component.css',
})
export class ChannelChatPanelComponent implements OnInit, OnChanges, OnDestroy {
  @Input() channelId = '';
  @Input() channelTitle = '';
  /** Full page header (# channel name). Off for voiceroom slide-out. */
  @Input() showHeader = true;
  @Output() closeRequested = new EventEmitter<void>();
  messages: IChatMessage[] = [];
  isUploading = false;
  uploadError: string | null = null;
  errorMessage: string | null = null;
  loading = true;
  currentUserId: string | null = null;
  currentUserImageUrl: string | null = null;
  currentUserName: string | null = null;
  composerReset = 0;
  gifPanelOpen = false;
  stickerPanelOpen = false;
  attachMenuOpen = false;
  mediaPickerOpen = false;
  locationPickerOpen = false;
  pendingFile: File | null = null;
  pendingUploadKind: ChatUploadKind | null = null;
  attachError: string | null = null;
  voicePanelOpen = false;
  pollComposerOpen = false;
  contactPickerOpen = false;
  contextMenuMsg: IChatMessage | null = null;
  contextMenuAnchor = { x: 0, y: 0 };
  reactionPickerMsgId: string | null = null;
  forwardMsg: IChatMessage | null = null;
  replyTo: IChatMessage | null = null;
  editingMsg: IChatMessage | null = null;
  editDraft = '';
  readonly isGifMessage = isGifMessage;
  readonly isImageMessage = isImageMessage;
  readonly isStickerMessage = isStickerMessage;
  readonly isVideoMessage = isVideoMessage;
  readonly isFileMessage = isFileMessage;
  readonly isLocationMessage = isLocationMessage;
  readonly parseFileContent = parseFileContent;
  readonly parseLocationContent = parseLocationContent;
  readonly isAudioMessage = isAudioMessage;
  readonly isContactMessage = isContactMessage;
  readonly isPollMessage = isPollMessage;
  readonly parseContactContent = parseContactContent;
  readonly parseMetadata = parseMetadata;
  readonly hasForwardedLabel = hasForwardedLabel;

  private subs = new Subscription();
  private historySub: Subscription | null = null;
  private avatarPrefetchSub: Subscription | null = null;
  /** Sender id -> avatar URL (filled from messages + profile lookups). */
  private readonly avatarByUserId = new Map<string, string>();
  /** Sender ids we already requested from the API (avoid duplicate calls). */
  private readonly avatarLookupDone = new Set<string>();

  constructor(
    private chat: ChatService,
    private auth: UserAuthService,
    private friends: FriendService
  ) {}

  ngOnInit(): void {
    this.subs.add(
      this.auth.getUserDetails().subscribe({
        next: (res) => {
          this.currentUserId = res.userData?._id ? String(res.userData._id) : null;
          const img = res.userData?.imageUrl;
          this.currentUserImageUrl =
            typeof img === 'string' && img.trim() ? img.trim() : null;
          const un = res.userData?.userName;
          this.currentUserName =
            typeof un === 'string' && un.trim() ? un.trim() : null;
          if (this.currentUserId && this.currentUserImageUrl) {
            this.avatarByUserId.set(this.currentUserId, this.currentUserImageUrl);
          }
          if (this.messages.length) {
            this.messages = [...this.messages];
          }
        },
        error: () => {
          this.errorMessage = 'Could not load user profile';
        },
      })
    );

    if (this.channelId) {
      this.loadHistory(this.channelId);
    }

    this.subs.add(
      this.chat.incomingMessage$.subscribe((msg) => {
        if (msg.chatId === this.channelId) {
          this.messages = [...this.messages, msg];
          this.seedAndPrefetchAvatars([msg]);
        }
      })
    );

    this.subs.add(
      this.chat.chatError$.subscribe((err) => {
        this.errorMessage = err;
      })
    );

    this.subs.add(
      this.chat.messageEdited$.subscribe((msg) => {
        if (msg.chatId === this.channelId) {
          this.messages = applyMessageEdited(this.messages, msg);
        }
      })
    );
    this.subs.add(
      this.chat.messageDeleted$.subscribe((p) => {
        if (p.chatId === this.channelId) {
          this.messages = applyMessageDeleted(this.messages, p);
        }
      })
    );
    this.subs.add(
      this.chat.reactionUpdated$.subscribe((p) => {
        if (p.chatId === this.channelId) {
          this.messages = applyReactionUpdated(this.messages, p);
        }
      })
    );
    this.subs.add(
      this.chat.pollUpdated$.subscribe((p) => {
        if (p.chatId === this.channelId) {
          this.messages = applyPollUpdated(this.messages, p);
        }
      })
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['channelId'] && !changes['channelId'].firstChange) {
      const id = this.channelId;
      if (id) {
        this.loadHistory(id);
      } else {
        this.historySub?.unsubscribe();
        this.historySub = null;
        this.messages = [];
        this.loading = false;
      }
    }
  }

  ngOnDestroy(): void {
    this.historySub?.unsubscribe();
    this.avatarPrefetchSub?.unsubscribe();
    this.subs.unsubscribe();
  }

  onClose(): void {
    this.closeRequested.emit();
  }

  private loadHistory(chatKey: string): void {
    this.historySub?.unsubscribe();
    this.loading = true;
    this.errorMessage = null;
    this.messages = [];
    this.avatarByUserId.clear();
    this.avatarLookupDone.clear();
    this.avatarPrefetchSub?.unsubscribe();
    this.avatarPrefetchSub = null;

    this.historySub = this.chat.getMessageHistory(chatKey).subscribe({
      next: (rows) => {
        this.messages = rows;
        this.seedAndPrefetchAvatars(rows);
        this.loading = false;
        void this.chat
          .connectRealtime()
          .then(() => this.chat.joinChat(chatKey))
          .catch((e: Error) => {
            this.errorMessage = e.message;
          });
      },
      error: (e: Error) => {
        this.loading = false;
        this.errorMessage = e.message;
      },
    });
  }

  async onComposerSend(payload: ChatComposerPayload): Promise<void> {
    this.closeAttachPanels();
    this.gifPanelOpen = false;
    this.stickerPanelOpen = false;
    const text = payload.text;
    const file = payload.file;
    const uploadKind = payload.uploadKind;
    if ((!text && !file) || !this.channelId || this.isUploading) return;

    try {
      this.errorMessage = null;
      this.uploadError = null;
      this.attachError = null;

      if (file && uploadKind) {
        const err = validateFileForUpload(file, uploadKind);
        if (err) {
          this.attachError = err;
          return;
        }
        this.isUploading = true;
        await uploadComposerFile(this.chat, this.channelId, file, uploadKind);
      }

      if (text) {
        this.chat.sendMessage(this.channelId, text, 'text', {
          replyToMessageId: this.replyTo?._id,
        });
      }

      this.clearPendingAttach();
      this.replyTo = null;
      this.composerReset++;
    } catch (e) {
      const message = (e as Error).message;
      this.uploadError = message;
      this.errorMessage = message;
    } finally {
      this.isUploading = false;
    }
  }

  toggleAttachMenu(): void {
    this.attachMenuOpen = !this.attachMenuOpen;
    if (this.attachMenuOpen) {
      this.gifPanelOpen = false;
      this.stickerPanelOpen = false;
      this.mediaPickerOpen = false;
      this.locationPickerOpen = false;
      this.voicePanelOpen = false;
      this.pollComposerOpen = false;
      this.contactPickerOpen = false;
    }
  }

  onAttachVoiceRequested(): void {
    this.attachMenuOpen = false;
    this.voicePanelOpen = true;
  }

  onAttachContactRequested(): void {
    this.attachMenuOpen = false;
    this.contactPickerOpen = true;
  }

  onAttachPollRequested(): void {
    this.attachMenuOpen = false;
    this.pollComposerOpen = true;
  }

  async onVoiceRecorded(file: File): Promise<void> {
    this.voicePanelOpen = false;
    if (!this.channelId) return;
    try {
      this.isUploading = true;
      await firstValueFrom(this.chat.sendAudioMessage(this.channelId, file));
      this.composerReset++;
    } catch (e) {
      this.uploadError = (e as Error).message;
    } finally {
      this.isUploading = false;
    }
  }

  onPollCreated(data: { question: string; options: string[]; allowMultiple: boolean }): void {
    this.pollComposerOpen = false;
    if (!this.channelId) return;
    this.chat.sendMessage(this.channelId, JSON.stringify(data), 'poll');
    this.composerReset++;
  }

  onContactPicked(friend: IUser): void {
    this.contactPickerOpen = false;
    if (!this.channelId) return;
    const content = JSON.stringify({
      userId: friend._id,
      userName: friend.userName,
      imageUrl: friend.imageUrl,
    });
    this.chat.sendMessage(this.channelId, content, 'contact');
    this.composerReset++;
  }

  openContextMenu(msg: IChatMessage, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const mouse = event as MouseEvent;
    this.contextMenuAnchor = { x: mouse.clientX, y: mouse.clientY };
    this.contextMenuMsg = msg;
  }

  closeContextMenu(): void {
    this.contextMenuMsg = null;
  }

  onContextReply(): void {
    if (!this.contextMenuMsg) return;
    this.replyTo = this.contextMenuMsg;
    this.closeContextMenu();
  }

  onContextReact(): void {
    if (!this.contextMenuMsg?._id) return;
    this.reactionPickerMsgId = this.contextMenuMsg._id;
    this.closeContextMenu();
  }

  onContextForward(): void {
    if (!this.contextMenuMsg) return;
    this.forwardMsg = this.contextMenuMsg;
    this.closeContextMenu();
  }

  onContextEdit(): void {
    const msg = this.contextMenuMsg;
    if (!msg) return;
    this.editingMsg = msg;
    if (msg.type === 'poll') {
      try {
        const p = JSON.parse(msg.content) as { question?: string };
        this.editDraft = p.question ?? '';
      } catch {
        this.editDraft = '';
      }
    } else {
      this.editDraft = msg.content;
    }
    this.closeContextMenu();
  }

  async saveEdit(): Promise<void> {
    if (!this.editingMsg?._id) return;
    try {
      await firstValueFrom(this.chat.editMessage(this.editingMsg._id, this.editDraft));
      this.editingMsg = null;
      this.editDraft = '';
    } catch (e) {
      this.errorMessage = (e as Error).message;
    }
  }

  cancelEdit(): void {
    this.editingMsg = null;
    this.editDraft = '';
  }

  async onContextDelete(): Promise<void> {
    const msg = this.contextMenuMsg;
    if (!msg?._id || !confirm('Delete this message?')) return;
    try {
      await firstValueFrom(this.chat.deleteMessage(msg._id));
    } catch (e) {
      this.errorMessage = (e as Error).message;
    }
    this.closeContextMenu();
  }

  async onReaction(msg: IChatMessage, emoji: string): Promise<void> {
    if (!msg._id) return;
    const existing = msg.reactions?.find((r) => r.reactedByMe);
    try {
      if (existing?.emoji === emoji) {
        await firstValueFrom(this.chat.removeReaction(msg._id));
      } else {
        await firstValueFrom(this.chat.setReaction(msg._id, emoji));
      }
    } catch (e) {
      this.errorMessage = (e as Error).message;
    }
    this.reactionPickerMsgId = null;
  }

  async onVotePoll(msg: IChatMessage, indexes: number[]): Promise<void> {
    if (!msg._id) return;
    try {
      await firstValueFrom(this.chat.votePoll(msg._id, indexes));
    } catch (e) {
      this.errorMessage = (e as Error).message;
    }
  }

  async onForwardToChat(targetChatId: string): Promise<void> {
    const msg = this.forwardMsg;
    if (!msg) return;
    try {
      await forwardMessageToChat(this.chat, targetChatId, msg, this.senderLabel(msg));
    } catch (e) {
      this.errorMessage = (e as Error).message;
    }
    this.forwardMsg = null;
  }

  replyPreviewText(): string | null {
    if (!this.replyTo) return null;
    const preview =
      this.replyTo.type === 'text' || this.replyTo.type === 'emoji'
        ? this.replyTo.content.length > 60
          ? this.replyTo.content.slice(0, 60) + '…'
          : this.replyTo.content
        : `[${this.replyTo.type}]`;
    return `${this.senderLabel(this.replyTo)}: ${preview}`;
  }

  cancelReply(): void {
    this.replyTo = null;
  }

  canEditMessage(msg: IChatMessage): boolean {
    return msg.type === 'text' || msg.type === 'poll';
  }

  metadataFor(msg: IChatMessage) {
    return parseMetadata(msg.metadata);
  }

  onAttachMediaRequested(): void {
    this.attachMenuOpen = false;
    this.mediaPickerOpen = true;
  }

  onAttachDocumentRequested(imageInput: HTMLInputElement): void {
    this.attachMenuOpen = false;
    triggerFileInput(imageInput);
  }

  onAttachLocationRequested(): void {
    this.attachMenuOpen = false;
    this.locationPickerOpen = true;
  }

  onMediaPhotoRequested(imageInput: HTMLInputElement): void {
    this.mediaPickerOpen = false;
    triggerFileInput(imageInput);
  }

  onMediaVideoRequested(videoInput: HTMLInputElement): void {
    this.mediaPickerOpen = false;
    triggerFileInput(videoInput);
  }

  onImageFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    onAttachFileChosen(this, file, 'image');
  }

  onVideoFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    onAttachFileChosen(this, file, 'video');
  }

  onDocumentFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    onAttachFileChosen(this, file, 'document');
  }

  onLocationPicked(location: ILocationMessageContent): void {
    this.locationPickerOpen = false;
    if (!this.channelId) return;
    sendLocationMessage(this.chat, this.channelId, location);
    this.composerReset++;
  }

  clearPendingAttach(): void {
    clearPendingAttach(this);
  }

  closeAttachPanels(): void {
    closeAllAttachPanels(this);
  }

  fileMessageContent(msg: { content: string }): IFileMessageContent | null {
    return parseFileContent(msg.content);
  }

  locationMessageContent(msg: { content: string }): ILocationMessageContent | null {
    return parseLocationContent(msg.content);
  }

  onGifChosen(url: string): void {
    this.gifPanelOpen = false;
    if (!this.channelId) return;
    this.chat.sendMessage(this.channelId, url, 'gif');
    this.composerReset++;
  }

  onStickerChosen(url: string): void {
    this.stickerPanelOpen = false;
    if (!this.channelId) return;
    this.chat.sendMessage(this.channelId, url, 'sticker');
    this.composerReset++;
  }

  toggleGifPanel(): void {
    this.gifPanelOpen = !this.gifPanelOpen;
    if (this.gifPanelOpen) {
      this.stickerPanelOpen = false;
      this.closeAttachPanels();
    }
  }

  toggleStickerPanel(): void {
    this.stickerPanelOpen = !this.stickerPanelOpen;
    if (this.stickerPanelOpen) {
      this.gifPanelOpen = false;
      this.closeAttachPanels();
    }
  }

  /** Display / aria name for the sender (never "You"). */
  senderLabel(msg: IChatMessage): string {
    const n = this.senderName(msg);
    if (n) return n;
    if (this.isMine(msg) && this.currentUserName) return this.currentUserName;
    return 'Unknown user';
  }

  /** Two-letter initials for avatar fallback. */
  avatarInitials(msg: IChatMessage): string {
    const n = this.senderName(msg);
    const label = n || (this.isMine(msg) ? this.currentUserName : null) || '?';
    return label.slice(0, 2).toUpperCase();
  }

  senderId(msg: IChatMessage): string {
    const s = msg.sender as unknown;
    if (typeof s === 'string') return s;
    if (s && typeof s === 'object' && '_id' in (s as object)) {
      return String((s as { _id: string })._id);
    }
    return '?';
  }

  senderName(msg: IChatMessage): string | null {
    const s = msg.sender as unknown;
    if (s && typeof s === 'object' && 'userName' in (s as object)) {
      const userName = (s as { userName?: string }).userName;
      return userName ? String(userName) : null;
    }
    return null;
  }

  /** Profile image URL from the message payload only (no cache). */
  private rawSenderImageFromMessage(msg: IChatMessage): string | null {
    const s = msg.sender as unknown;
    if (s && typeof s === 'object' && 'imageUrl' in (s as object)) {
      const url = (s as { imageUrl?: string }).imageUrl;
      if (typeof url === 'string' && url.trim()) return url.trim();
    }
    return null;
  }

  private seedAndPrefetchAvatars(msgs: IChatMessage[]): void {
    for (const m of msgs) {
      const id = this.senderId(m);
      const url = this.rawSenderImageFromMessage(m);
      if (id && id !== '?' && url) {
        this.avatarByUserId.set(id, url);
      }
    }
    if (this.currentUserId && this.currentUserImageUrl) {
      this.avatarByUserId.set(this.currentUserId, this.currentUserImageUrl);
    }
    this.prefetchAvatarsForSenders(msgs);
  }

  /** Load avatar URLs for senders not already present on messages or in cache. */
  private prefetchAvatarsForSenders(msgs: IChatMessage[]): void {
    const pending: string[] = [];
    for (const m of msgs) {
      const id = this.senderId(m);
      if (!id || id === '?') continue;
      if (this.rawSenderImageFromMessage(m)) continue;
      if (this.avatarByUserId.has(id)) continue;
      if (this.avatarLookupDone.has(id)) continue;
      this.avatarLookupDone.add(id);
      pending.push(id);
    }
    if (!pending.length) return;

    this.avatarPrefetchSub?.unsubscribe();
    this.avatarPrefetchSub = forkJoin(
        pending.map((id) =>
          this.friends.getUserDetails(id).pipe(
            map((u) => {
              const url = u.imageUrl;
              return {
                id,
                url: typeof url === 'string' && url.trim() ? url.trim() : '',
              };
            }),
            catchError(() => of({ id, url: '' }))
          )
        )
      ).subscribe((results) => {
        let changed = false;
        for (const { id, url } of results) {
          if (url) {
            this.avatarByUserId.set(id, url);
            changed = true;
          }
        }
        if (changed) {
          this.messages = [...this.messages];
        }
      });
  }

  /** Profile photo: message body, then cache (any participant), then current-user session fallback. */
  senderImageUrl(msg: IChatMessage): string | null {
    const fromMsg = this.rawSenderImageFromMessage(msg);
    if (fromMsg) return fromMsg;
    const sid = this.senderId(msg);
    const cached = sid && sid !== '?' ? this.avatarByUserId.get(sid) : undefined;
    if (cached) return cached;
    if (this.isMine(msg) && this.currentUserImageUrl) {
      return this.currentUserImageUrl;
    }
    return null;
  }

  isMine(msg: IChatMessage): boolean {
    return this.currentUserId !== null && this.senderId(msg) === this.currentUserId;
  }

  senderAvatarStyle(msg: IChatMessage): Record<string, string> {
    if (this.isMine(msg)) {
      return {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        color: '#a1a1aa',
      };
    }
    const { avatarBg, avatarFg } = chatSenderColors(this.senderId(msg));
    return { backgroundColor: avatarBg, color: avatarFg };
  }

  senderNameStyle(msg: IChatMessage): Record<string, string> {
    if (this.isMine(msg)) {
      return { color: '#d4d4d8' };
    }
    return { color: chatSenderColors(this.senderId(msg)).nameColor };
  }

  messageBubbleStyle(msg: IChatMessage): Record<string, string> {
    return chatSenderMessageBubbleStyle(this.senderId(msg), this.isMine(msg));
  }

  trackByMsg(_index: number, msg: IChatMessage): string {
    return msg._id ?? `${msg.timestamp}-${this.senderId(msg)}`;
  }
}
