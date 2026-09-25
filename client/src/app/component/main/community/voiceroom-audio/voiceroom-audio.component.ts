import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { map } from 'rxjs/operators';
import { LkTrackAttachDirective } from '../voiceroom/lk-track-attach.directive';
import {
  IVoiceroomParticipantView,
  VoiceroomService,
} from '../../../../services/voiceroom.service';

/**
 * Plays every remote participant's audio for the active voice room.
 *
 * Mounted once in the community layout, which outlives the voice-room page:
 * you can stay connected while reading a chat channel. The <audio> elements
 * used to live inside the voice-room page itself, so navigating to any other
 * channel detached them — you went silently deaf while still transmitting,
 * with the sidebar insisting "Voice connected".
 *
 * Deafen is applied here, by muting the elements.
 */
@Component({
  selector: 'app-voiceroom-audio',
  standalone: true,
  imports: [CommonModule, LkTrackAttachDirective],
  template: `
    <ng-container *ngIf="{ remotes: remotes$ | async, deafened: voiceroom.deafened$ | async } as vm">
      <audio
        *ngFor="let p of vm.remotes; trackBy: byIdentity"
        class="sr-only"
        autoplay
        playsinline
        [appLkTrack]="p.audioTrack"
        [lkMuted]="!!vm.deafened"
      ></audio>
    </ng-container>
  `,
  host: { class: 'contents' },
})
export class VoiceroomAudioComponent {
  readonly remotes$ = this.voiceroom.participants$.pipe(
    map((ps) => ps.filter((p) => !p.isLocal && !!p.audioTrack))
  );

  constructor(readonly voiceroom: VoiceroomService) {}

  byIdentity(_: number, p: IVoiceroomParticipantView): string {
    return p.identity;
  }
}
