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

}

