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

  get containerClasses(): string {
    return this.isDm
      ? 'w-full rounded-b-2xl border-t border-zinc-800 bg-surface-900 p-4'
      : 'border-t border-zinc-700 bg-zinc-800 p-4';
  }

  get pendingFileChipClasses(): string {
    return this.isDm
      ? 'mb-2 flex items-center justify-between rounded-lg bg-zinc-800 px-3 py-2 text-sm'
      : 'mb-2 flex items-center justify-between rounded-lg bg-zinc-900 px-3 py-2 text-sm';
  }

  get inputClasses(): string {
    return this.isDm
      ? 'min-w-0 flex-1 rounded-2xl bg-black px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50'
      : 'min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 focus:border-indigo-500 focus:outline-none disabled:opacity-50';
  }

  get iconButtonClasses(): string {
    return this.isDm
      ? 'inline-flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 text-zinc-200 hover:bg-zinc-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand'
      : 'inline-flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-700 text-zinc-200 transition-colors hover:bg-zinc-600 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand';
  }

  get sendButtonClasses(): string {
    return this.isDm
      ? 'shrink-0 rounded-2xl bg-green-500 px-4 py-2 text-white hover:bg-green-600 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand'
      : 'shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-500 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand';
  }

}

