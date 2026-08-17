import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IMessageMetadata } from '../../../util/message-display';

@Component({
  selector: 'app-chat-link-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-link-preview.component.html',
})
export class ChatLinkPreviewComponent {
  @Input({ required: true }) preview!: NonNullable<IMessageMetadata['linkPreview']>;
}
