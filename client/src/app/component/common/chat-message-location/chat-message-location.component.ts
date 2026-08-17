import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import {
  ILocationMessageContent,
  locationMapsUrl,
  locationStaticMapUrl,
} from '../../../util/message-display';

@Component({
  selector: 'app-chat-message-location',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-message-location.component.html',
})
export class ChatMessageLocationComponent {
  @Input({ required: true }) location!: ILocationMessageContent;

  get mapImageUrl(): string {
    return locationStaticMapUrl(this.location.lat, this.location.lng);
  }

  get mapsLink(): string {
    return locationMapsUrl(this.location.lat, this.location.lng);
  }

  get displayLabel(): string {
    return this.location.label?.trim() || 'Shared location';
  }
}
