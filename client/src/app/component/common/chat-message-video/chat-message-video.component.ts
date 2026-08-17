import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-chat-message-video',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-message-video.component.html',
})
export class ChatMessageVideoComponent {
  @Input({ required: true }) src!: string;
}
