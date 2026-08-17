import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IReactionSummary } from '../../../services/chat.service';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢'];

@Component({
  selector: 'app-chat-message-reactions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-message-reactions.component.html',
})
export class ChatMessageReactionsComponent {
  @Input() reactions: IReactionSummary[] = [];
  @Input() showPicker = false;
  @Output() react = new EventEmitter<string>();
  @Output() togglePicker = new EventEmitter<void>();

  readonly quickEmojis = QUICK_EMOJIS;
}
