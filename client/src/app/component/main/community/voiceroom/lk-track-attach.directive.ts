import {
  Directive,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
} from '@angular/core';
import { LocalTrack, RemoteTrack } from 'livekit-client';

export type LkAttachableTrack = LocalTrack | RemoteTrack | null | undefined;

@Directive({
  selector: '[appLkTrack]',
  standalone: true,
})
export class LkTrackAttachDirective implements OnChanges, OnDestroy {
  @Input('appLkTrack') track: LkAttachableTrack = null;
  @Input() lkMuted = false;

  private attached: LkAttachableTrack = null;

  constructor(private readonly el: ElementRef<HTMLMediaElement>) {}

  ngOnChanges(): void {
    this.sync();
  }

  ngOnDestroy(): void {
    this.detachCurrent();
  }

  private sync(): void {
    const next = this.track ?? null;
    if (this.attached !== next) {
      this.detachCurrent();
      this.attached = next;
      if (next) {
        next.attach(this.el.nativeElement);
        void this.el.nativeElement.play().catch(() => undefined);
      } else {
        this.el.nativeElement.srcObject = null;
      }
    }
    this.el.nativeElement.muted = this.lkMuted;
  }

  private detachCurrent(): void {
    if (this.attached) {
      this.attached.detach(this.el.nativeElement);
      this.attached = null;
    }
    this.el.nativeElement.srcObject = null;
  }
}
