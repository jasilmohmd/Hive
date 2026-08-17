import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IChatMessage } from '../../../services/chat.service';
import {
  IFileMessageContent,
  ILocationMessageContent,
  hasForwardedLabel,
  isAudioMessage,
  isContactMessage,
  isFileMessage,
  isGifMessage,
  isImageMessage,
  isLocationMessage,
  isPollMessage,
  isStickerMessage,
  isVideoMessage,
  parseContactContent,
  parseFileContent,
  parseLocationContent,
  parseMetadata,
} from '../../../util/message-display';
import { ChatMediaComponent } from '../chat-media/chat-media.component';
import { ChatLinkPreviewComponent } from '../chat-link-preview/chat-link-preview.component';
import { ChatMessageAudioComponent } from '../chat-message-audio/chat-message-audio.component';
import { ChatMessageContactComponent } from '../chat-message-contact/chat-message-contact.component';
import { ChatMessageFileComponent } from '../chat-message-file/chat-message-file.component';
import { ChatMessageLocationComponent } from '../chat-message-location/chat-message-location.component';
import { ChatMessagePollComponent } from '../chat-message-poll/chat-message-poll.component';
import { ChatMessageReplyComponent } from '../chat-message-reply/chat-message-reply.component';
import { ChatMessageVideoComponent } from '../chat-message-video/chat-message-video.component';

/**
 * Renders the inside of a chat message bubble: the forwarded label, the quoted
 * reply, and whichever body matches the message type (sticker, audio, video,
 * file, location, contact, poll, gif/image, or plain text with link preview).
 *
 * Shared by the DM thread and the community channel chat panel; the bubble's
 * own chrome (alignment, avatar, timestamp, reactions) stays with each host.
 */
@Component({
  selector: 'app-chat-message-body',
  standalone: true,
  imports: [
    CommonModule,
    ChatMediaComponent,
    ChatLinkPreviewComponent,
    ChatMessageAudioComponent,
    ChatMessageContactComponent,
    ChatMessageFileComponent,
    ChatMessageLocationComponent,
    ChatMessagePollComponent,
    ChatMessageReplyComponent,
    ChatMessageVideoComponent,
  ],
  templateUrl: './chat-message-body.component.html',
  // `display: contents` keeps this wrapper out of the layout so the bubble's
  // children lay out exactly as they did before they were extracted.
  host: { class: 'contents' },
})
export class ChatMessageBodyComponent {
  @Input({ required: true }) msg!: IChatMessage;
  /** Where this bubble lives, used in image/GIF alt text: "GIF in {{ context }}". */
  @Input() context = 'conversation';

  @Output() vote = new EventEmitter<number[]>();

  readonly isStickerMessage = isStickerMessage;
  readonly isAudioMessage = isAudioMessage;
  readonly isVideoMessage = isVideoMessage;
  readonly isFileMessage = isFileMessage;
  readonly isLocationMessage = isLocationMessage;
  readonly isContactMessage = isContactMessage;
  readonly isPollMessage = isPollMessage;
  readonly isGifMessage = isGifMessage;
  readonly isImageMessage = isImageMessage;
  readonly parseContactContent = parseContactContent;
  readonly hasForwardedLabel = hasForwardedLabel;

  metadataFor(msg: IChatMessage) {
    return parseMetadata(msg.metadata);
  }

  fileMessageContent(msg: { content: string }): IFileMessageContent | null {
    return parseFileContent(msg.content);
  }

  locationMessageContent(msg: { content: string }): ILocationMessageContent | null {
    return parseLocationContent(msg.content);
  }
}
