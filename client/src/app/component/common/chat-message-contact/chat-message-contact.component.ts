import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IContactMessageContent } from '../../../util/message-display';

@Component({
  selector: 'app-chat-message-contact',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-message-contact.component.html',
})
export class ChatMessageContactComponent {
  @Input({ required: true }) contact!: IContactMessageContent;
}
