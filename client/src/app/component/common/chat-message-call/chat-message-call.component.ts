import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IChatMessage } from '../../../services/chat.service';
import {
  callMessageLabel,
  isMissedCallMessage,
  parseCallMessageContent,
} from '../../../util/message-display';

@Component({
  selector: 'app-chat-message-call',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-message-call.component.html',
})
export class ChatMessageCallComponent {
  @Input({ required: true }) msg!: IChatMessage;
  @Input() viewerId: string | null = null;

  get label(): string {
    return callMessageLabel(this.msg, this.viewerId);
  }

  get missed(): boolean {
    return isMissedCallMessage(this.msg, this.viewerId);
  }

  get isVideo(): boolean {
    return parseCallMessageContent(this.msg.content)?.callType === 'video';
  }

  get isOutgoing(): boolean {
    const data = parseCallMessageContent(this.msg.content);
    return !!data && !!this.viewerId && data.callerId === this.viewerId;
  }
}
