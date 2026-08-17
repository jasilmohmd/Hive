import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-voiceroom-media-icons',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="inline-flex items-center gap-1" [class.gap-0.5]="compact">
      <span class="relative inline-flex" [attr.title]="muted ? 'Microphone off' : 'Microphone on'">
        <img
          src="assets/Icons/mic-fill.png"
          alt=""
          class="object-contain"
          [class.h-3]="compact"
          [class.w-3]="compact"
          [class.h-4]="!compact"
          [class.w-4]="!compact"
          [class.opacity-35]="muted"
        />
        <span
          *ngIf="muted"
          class="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <span
            class="block w-full rotate-45 rounded-sm bg-red-500/90"
            [class.h-px]="compact"
            [class.h-0.5]="!compact"
          ></span>
        </span>
      </span>

      <span class="relative inline-flex" [attr.title]="cameraOn ? 'Camera on' : 'Camera off'">
        <svg
          viewBox="0 0 24 24"
          class="fill-current text-zinc-400"
          [class.h-3]="compact"
          [class.w-3]="compact"
          [class.h-4]="!compact"
          [class.w-4]="!compact"
          [class.text-emerald-400]="cameraOn"
          [class.opacity-35]="!cameraOn"
          aria-hidden="true"
        >
          <path
            d="M17 10.5V7a2 2 0 0 0-2-2H5A2 2 0 0 0 3 7v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3.5l4.15 3.12a1 1 0 0 0 1.55-.8v-11.64a1 1 0 0 0-1.55-.8L17 10.5z"
          />
        </svg>
        <span
          *ngIf="!cameraOn"
          class="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <span
            class="block w-full rotate-45 rounded-sm bg-red-500/90"
            [class.h-px]="compact"
            [class.h-0.5]="!compact"
          ></span>
        </span>
      </span>

      <span
        *ngIf="showScreen"
        class="inline-flex"
        [attr.title]="screenOn ? 'Sharing screen' : 'Screen off'"
      >
        <svg
          viewBox="0 0 24 24"
          class="fill-current text-zinc-500"
          [class.h-3]="compact"
          [class.w-3]="compact"
          [class.h-4]="!compact"
          [class.w-4]="!compact"
          [class.text-violet-400]="screenOn"
          [class.opacity-35]="!screenOn"
          aria-hidden="true"
        >
          <path
            d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7v2H8v2h8v-2h-2v-2h7c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"
          />
        </svg>
      </span>
    </span>
  `,
})
export class VoiceroomMediaIconsComponent {
  @Input() muted = false;
  @Input() cameraOn = false;
  @Input() screenOn = false;
  @Input() showScreen = false;
  @Input() compact = true;
}
