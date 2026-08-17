import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { firstValueFrom, map, of, Subscription, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ChatService, IChatMessage } from '../../../services/chat.service';
import { UserAuthService } from '../../../services/user-auth.service';
import { FriendService, IUser } from '../../../services/friends.service';
import { CallService, CallType } from '../../../services/call.service';
import { DmCallOverlayComponent } from '../../common/dm-call-overlay/dm-call-overlay.component';
import {
  ChatComposerComponent,
  ChatComposerPayload,
} from '../../common/chat-composer/chat-composer.component';
import { LoadingStateComponent } from '../../common/loading-state/loading-state.component';
import { ErrorAlertComponent } from '../../common/error-alert/error-alert.component';
import { EmptyStateComponent } from '../../common/empty-state/empty-state.component';
import { ChatMediaComponent } from '../../common/chat-media/chat-media.component';
import { ChatGifPickerComponent } from '../../common/chat-gif-picker/chat-gif-picker.component';
import { ChatAttachMenuComponent } from '../../common/chat-attach-menu/chat-attach-menu.component';
import { ChatMediaPickerComponent } from '../../common/chat-media-picker/chat-media-picker.component';
import { ChatLocationPickerComponent } from '../../common/chat-location-picker/chat-location-picker.component';
import { ChatMessageVideoComponent } from '../../common/chat-message-video/chat-message-video.component';
import { ChatMessageFileComponent } from '../../common/chat-message-file/chat-message-file.component';
import { ChatMessageLocationComponent } from '../../common/chat-message-location/chat-message-location.component';
import { ChatMessageAudioComponent } from '../../common/chat-message-audio/chat-message-audio.component';
import { ChatMessageReplyComponent } from '../../common/chat-message-reply/chat-message-reply.component';
import { ChatLinkPreviewComponent } from '../../common/chat-link-preview/chat-link-preview.component';
import { ChatMessageContactComponent } from '../../common/chat-message-contact/chat-message-contact.component';
import { ChatMessagePollComponent } from '../../common/chat-message-poll/chat-message-poll.component';
import { ChatMessageReactionsComponent } from '../../common/chat-message-reactions/chat-message-reactions.component';
import { ChatMessageContextMenuComponent } from '../../common/chat-message-context-menu/chat-message-context-menu.component';
import { ChatVoiceRecorderComponent } from '../../common/chat-voice-recorder/chat-voice-recorder.component';
import { ChatPollComposerComponent } from '../../common/chat-poll-composer/chat-poll-composer.component';
import { ChatContactPickerComponent } from '../../common/chat-contact-picker/chat-contact-picker.component';
import { ChatForwardPickerComponent } from '../../common/chat-forward-picker/chat-forward-picker.component';
import { ChatMessageCallComponent } from '../../common/chat-message-call/chat-message-call.component';
import { chatSenderMessageBubbleStyle } from '../../../util/chat-sender-color';
import { ChatUploadKind, validateFileForUpload } from '../../../util/chat-attachment';
import {
  closeAllAttachPanels,
  clearPendingAttach,
  onAttachFileChosen,
  sendLocationMessage,
  triggerFileInput,
  uploadComposerFile,
} from '../../../util/chat-attachment-host';
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
  isCallMessage,
  parseContactContent,
  parseMetadata,
  hasForwardedLabel,
} from '../../../util/message-display';
import {
  applyMessageDeleted,
  applyMessageEdited,
  applyPollUpdated,
  applyReactionUpdated,
  forwardMessageToChat,
} from '../../../util/chat-message-actions';

@Component({
  selector: 'app-direct-message',
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
    ChatMessageCallComponent,
    DmCallOverlayComponent,
  ],
  templateUrl: './direct-message.component.html',
  styleUrl: './direct-message.component.css',
})
export class DirectMessageComponent implements OnInit, OnDestroy {
  friendId: string | null = null;
  chatId: string | null = null;
  messages: IChatMessage[] = [];
  isUploading = false;
  uploadError: string | null = null;
  errorMessage: string | null = null;
  loading = false;
  currentUserId: string | null = null;
  friendDisplayName: string | null = null;
  friendImageUrl: string | null = null;
  composerReset = 0;
  gifPanelOpen = false;
  stickerPanelOpen = false;
  attachMenuOpen = false;
  mediaPickerOpen = false;
  locationPickerOpen = false;
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
  pendingFile: File | null = null;
  pendingUploadKind: ChatUploadKind | null = null;
  attachError: string | null = null;
  readonly isGifMessage = isGifMessage;
  readonly isImageMessage = isImageMessage;
  readonly isStickerMessage = isStickerMessage;
  readonly isVideoMessage = isVideoMessage;
  readonly isFileMessage = isFileMessage;
  readonly isLocationMessage = isLocationMessage;
  readonly isAudioMessage = isAudioMessage;
  readonly isContactMessage = isContactMessage;
  readonly isPollMessage = isPollMessage;
  readonly isCallMessage = isCallMessage;
  readonly parseContactContent = parseContactContent;
  readonly hasForwardedLabel = hasForwardedLabel;

  private subs = new Subscription();
  private historySub: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private chat: ChatService,
    private auth: UserAuthService,
    private friends: FriendService,
    private call: CallService
  ) {}

  ngOnInit(): void {
    this.subs.add(
      this.call.callError$.subscribe((msg) => {
        this.errorMessage = msg;
      })
    );

    this.subs.add(
      this.auth.getUserDetails().subscribe({
        next: (res) => {
          this.currentUserId = res.userData?._id ? String(res.userData._id) : null;
          this.tryOpenChat();
          if (this.messages.length) {
            this.messages = [...this.messages];
          }
        },
        error: () => {
          this.errorMessage = 'Could not load user profile';
        },
      })
    );

    this.subs.add(
      this.route.queryParamMap
        .pipe(
          map((params) => params.get('friendId')),
          switchMap((fid) => {
            this.friendId = fid;
            this.friendDisplayName = null;
            this.friendImageUrl = null;
            if (!fid) {
              return of(null);
            }
            return this.friends.getUserDetails(fid).pipe(
              map((u) => {
                this.friendDisplayName =
                  typeof u.userName === 'string' && u.userName.trim()
                    ? u.userName.trim()
                    : null;
                const url = u.imageUrl;
                this.friendImageUrl =
                  typeof url === 'string' && url.trim() ? url.trim() : null;
                return u;
              }),
              catchError(() => of(null))
            );
          })
        )
        .subscribe(() => {
          this.tryOpenChat();
          if (this.messages.length) {
            this.messages = [...this.messages];
          }
        })
    );

    this.subs.add(
      this.chat.incomingMessage$.subscribe((msg) => {
        if (this.chatId && msg.chatId === this.chatId) {
          this.messages = [...this.messages, msg];
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
        if (msg.chatId === this.chatId) {
          this.messages = applyMessageEdited(this.messages, msg);
        }
      })
    );
    this.subs.add(
      this.chat.messageDeleted$.subscribe((p) => {
        if (p.chatId === this.chatId) {
          this.messages = applyMessageDeleted(this.messages, p);
        }
      })
    );
    this.subs.add(
      this.chat.reactionUpdated$.subscribe((p) => {
        if (p.chatId === this.chatId) {
          this.messages = applyReactionUpdated(this.messages, p);
        }
      })
    );
    this.subs.add(
      this.chat.pollUpdated$.subscribe((p) => {
        if (p.chatId === this.chatId) {
          this.messages = applyPollUpdated(this.messages, p);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.historySub?.unsubscribe();
    this.subs.unsubscribe();
    if (this.call.isInCall()) {
      this.call.endCall();
    }
  }

  async startVoiceCall(): Promise<void> {
    await this.startCall('audio');
  }

  async startVideoCall(): Promise<void> {
    await this.startCall('video');
  }

  private async startCall(callType: CallType): Promise<void> {
    if (!this.chatId || !this.friendId) return;
    this.errorMessage = null;
    this.voicePanelOpen = false;
    this.attachMenuOpen = false;
    if (callType === 'video') {
      this.call.releaseMediaDevices();
    }
    try {
      await this.chat.connectRealtime();
      await this.call.startCall(this.chatId, this.friendId, callType);
    } catch (e) {
      this.errorMessage = (e as Error).message;
    }
  }

  tryOpenChat(): void {
    if (!this.friendId || !this.currentUserId) {
      if (!this.friendId) {
        this.chatId = null;
        this.messages = [];
      }
      return;
    }
    this.openChat(this.friendId);
  }

  private openChat(friendId: string): void {
    if (!this.currentUserId) return;
    const cid = ChatService.directChatId(this.currentUserId, friendId);
    if (this.chatId === cid) return;
    this.chatId = cid;
    this.loadHistory(cid);
  }

  private loadHistory(chatKey: string): void {
    this.historySub?.unsubscribe();
    this.loading = true;
    this.errorMessage = null;
    this.messages = [];

    this.historySub = this.chat.getMessageHistory(chatKey).subscribe({
      next: (rows) => {
        this.messages = rows;
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
    if ((!text && !file) || !this.chatId || this.isUploading) return;

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
        await uploadComposerFile(this.chat, this.chatId, file, uploadKind);
      }

      if (text) {
        this.chat.sendMessage(this.chatId, text, 'text', {
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
    if (this.call.isInCall()) {
      this.uploadError = 'End the call before sending a voice message.';
      return;
    }
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
    if (!this.chatId) return;
    if (file.size < 200) {
      this.uploadError = 'Recording was too short. Try again.';
      return;
    }
    try {
      this.isUploading = true;
      this.uploadError = null;
      const msg = await firstValueFrom(this.chat.sendAudioMessage(this.chatId, file));
      if (msg.chatId === this.chatId && !this.messages.some((m) => m._id === msg._id)) {
        this.messages = [...this.messages, msg];
      }
      this.composerReset++;
    } catch (e) {
      this.uploadError = (e as Error).message;
    } finally {
      this.isUploading = false;
    }
  }

  onPollCreated(data: { question: string; options: string[]; allowMultiple: boolean }): void {
    this.pollComposerOpen = false;
    if (!this.chatId) return;
    this.chat.sendMessage(this.chatId, JSON.stringify(data), 'poll');
    this.composerReset++;
  }

  onContactPicked(friend: IUser): void {
    this.contactPickerOpen = false;
    if (!this.chatId) return;
    const content = JSON.stringify({
      userId: friend._id,
      userName: friend.userName,
      imageUrl: friend.imageUrl,
    });
    this.chat.sendMessage(this.chatId, content, 'contact');
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

  isRegularMessage(msg: IChatMessage): boolean {
    return !isCallMessage(msg);
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
    if (!this.chatId) return;
    sendLocationMessage(this.chat, this.chatId, location);
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
    if (!this.chatId) return;
    this.chat.sendMessage(this.chatId, url, 'gif');
    this.composerReset++;
  }

  onStickerChosen(url: string): void {
    this.stickerPanelOpen = false;
    if (!this.chatId) return;
    this.chat.sendMessage(this.chatId, url, 'sticker');
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

  senderLabel(msg: IChatMessage): string {
    if (this.isMine(msg)) return 'You';
    return this.friendDisplayName || 'Friend';
  }

  senderId(msg: IChatMessage): string {
    const s = msg.sender as unknown;
    if (typeof s === 'string') return s;
    if (s && typeof s === 'object' && '_id' in (s as object)) {
      return String((s as { _id: string })._id);
    }
    return '?';
  }

  isMine(msg: IChatMessage): boolean {
    return this.currentUserId !== null && this.senderId(msg) === this.currentUserId;
  }

  messageBubbleStyle(msg: IChatMessage): Record<string, string> {
    return chatSenderMessageBubbleStyle(this.senderId(msg), this.isMine(msg));
  }

  trackByMsg(_index: number, msg: IChatMessage): string {
    return msg._id ?? `${msg.timestamp}-${this.senderId(msg)}`;
  }
}
