import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ILocationMessageContent } from '../../../util/message-display';

@Component({
  selector: 'app-chat-location-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-location-picker.component.html',
})
export class ChatLocationPickerComponent {
  @Input() theme: 'dm' | 'channel' = 'dm';
  @Output() picked = new EventEmitter<ILocationMessageContent>();
  @Output() dismiss = new EventEmitter<void>();

  label = '';
  loading = false;
  error: string | null = null;

  onBackdropClick(): void {
    this.dismiss.emit();
  }

  shareLocation(): void {
    if (!navigator.geolocation) {
      this.error = 'Location is not supported in this browser.';
      return;
    }
    this.loading = true;
    this.error = null;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.loading = false;
        const payload: ILocationMessageContent = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        const trimmed = this.label.trim();
        if (trimmed) {
          payload.label = trimmed;
        } else {
          payload.label = 'Shared location';
        }
        this.picked.emit(payload);
      },
      (err) => {
        this.loading = false;
        if (err.code === err.PERMISSION_DENIED) {
          this.error = 'Location permission denied.';
        } else {
          this.error = 'Could not get your location. Try again.';
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }
}
