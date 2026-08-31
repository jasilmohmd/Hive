import { CommonModule } from '@angular/common';

import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { ChatUploadKind } from '../../../util/chat-attachment';

import { formatFileSize } from '../../../util/chat-attachment';



export interface ChatComposerPayload {

  text: string;

  file: File | null;

  uploadKind?: ChatUploadKind | null;

}



@Component({

  selector: 'app-chat-composer',

  standalone: true,

  imports: [CommonModule, FormsModule],

  templateUrl: './chat-composer.component.html',

})

export class ChatComposerComponent implements OnChanges {

  @Input() disabled = false;

  /** History loading / socket unavailable */

  @Input() busy = false;

  @Input() isUploading = false;

  @Input() placeholder = 'Type a message...';

  @Input() resetNonce = 0;

  /** dm: dark chrome matching DM page; channel: chatroom bar */

  @Input() theme: 'dm' | 'channel' = 'dm';

  @Input() pendingFile: File | null = null;

  @Input() pendingUploadKind: ChatUploadKind | null = null;

  @Input() attachError: string | null = null;
  @Input() replyPreview: string | null = null;

  @Output() sendRequested = new EventEmitter<ChatComposerPayload>();
  @Output() cancelReply = new EventEmitter<void>();

  @Output() gifPickRequested = new EventEmitter<void>();

  @Output() stickerPickRequested = new EventEmitter<void>();

  @Output() attachMenuRequested = new EventEmitter<void>();

  @Output() clearPendingFile = new EventEmitter<void>();



  draft = '';



  ngOnChanges(changes: SimpleChanges): void {

    if (changes['resetNonce'] && !changes['resetNonce'].firstChange) {

      this.draft = '';

    }

  }



  removePending(): void {

    this.clearPendingFile.emit();

  }



  formatSize(bytes: number): string {

    return formatFileSize(bytes);

  }



  pendingKindLabel(): string {

    if (this.pendingUploadKind === 'video') return 'Video';

    if (this.pendingUploadKind === 'document') return 'Document';

    return 'Photo';

  }



  send(): void {

    if (this.disabled || this.busy || this.isUploading) return;

    const text = this.draft.trim();

    if (!text && !this.pendingFile) return;

    this.sendRequested.emit({

      text,

      file: this.pendingFile,

      uploadKind: this.pendingUploadKind,

    });

  }



  get sendBlocked(): boolean {

    return (

      this.disabled ||

      this.busy ||

      (!this.draft.trim() && !this.pendingFile) ||

      this.isUploading

    );

  }



  get attachBlocked(): boolean {

    return this.disabled || this.busy || this.isUploading;

  }

  /** dm/channel differ only in chrome (rounded-2xl+dark vs rounded-lg+bordered) — everything else is shared markup. */
  private get isDm(): boolean {
    return this.theme === 'dm';
  }

  /**
   * The two themes differ only in chrome — radius and surface depth. Both were
   * still on raw zinc/indigo/green Tailwind colours; they now sit on the token
   * ramp so the composer matches the rest of the app.
   *
   * Sizing is mobile-first throughout: the community layout keeps its channel
   * sidebar at every breakpoint, so on a 390px phone this bar has roughly 230px
   * to work in. Padding, control size and the send label all step up at md.
   */
  get containerClasses(): string {
    return this.isDm
      ? 'w-full rounded-b-2xl border-t border-surface-800 bg-surface-900 p-2 md:p-4'
      : 'border-t border-surface-700 bg-surface-850 p-2 md:p-4';
  }

  get pendingFileChipClasses(): string {
    return this.isDm
      ? 'mb-2 flex items-center justify-between rounded-lg bg-surface-800 px-3 py-2 text-xs md:text-sm'
      : 'mb-2 flex items-center justify-between rounded-lg bg-surface-900 px-3 py-2 text-xs md:text-sm';
  }

  get inputClasses(): string {
    const shared =
      'w-full min-w-0 px-3 py-2 text-sm text-ink placeholder-ink-muted focus:outline-none disabled:opacity-50 md:w-auto md:flex-1 md:px-4 md:text-base';
    return this.isDm
      ? `${shared} rounded-2xl bg-surface-950 focus:ring-2 focus:ring-brand`
      : `${shared} rounded-lg border border-surface-700 bg-surface-900 focus:border-brand`;
  }

  /**
   * 36px on phones rather than 40px — three of these plus the send button have
   * to share one row below the input.
   */
  get iconButtonClasses(): string {
    const shared =
      'inline-flex h-9 w-9 items-center justify-center text-ink-secondary transition-colors hover:text-ink disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand md:h-10 md:w-10';
    return this.isDm
      ? `${shared} rounded-xl bg-surface-800 hover:bg-surface-700`
      : `${shared} rounded-lg bg-surface-700 hover:bg-surface-600`;
  }

  /** Brand amber needs dark text — light-on-light fails contrast badly. */
  get sendButtonClasses(): string {
    const shared =
      'ml-auto shrink-0 bg-brand px-3 py-2 text-sm font-medium text-surface-950 transition-colors hover:bg-brand-hover disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand md:ml-0 md:px-4 md:text-base';
    return this.isDm ? `${shared} rounded-2xl` : `${shared} rounded-lg`;
  }

}

