import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IMessageReplyTo } from '../../../services/chat.service';
import { replyPreviewText, senderNameFromRef } from '../../../util/message-display';

@Component({
  selector: 'app-chat-message-reply',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-message-reply.component.html',
})
export class ChatMessageReplyComponent {
  @Input({ required: true }) reply!: IMessageReplyTo;

  preview(): string {
    return replyPreviewText(this.reply);
  }

  senderName(): string {
    return senderNameFromRef(this.reply.sender);
  }
}
