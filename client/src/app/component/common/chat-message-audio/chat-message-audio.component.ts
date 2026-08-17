import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-chat-message-audio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-message-audio.component.html',
})
export class ChatMessageAudioComponent {
  @Input({ required: true }) src!: string;
}
