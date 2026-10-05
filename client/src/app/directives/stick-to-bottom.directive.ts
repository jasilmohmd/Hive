import {
  AfterViewInit,
  Directive,
  ElementRef,
  HostListener,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';

/**
 * Keeps a chat's message list pinned to the newest message — the way every
 * chat app behaves, and the way neither Hive chat view did: both opened at the
 * *oldest* message and never followed new ones.
 *
 * Put it on the scroll container and bind something that changes when
 * messages arrive:
 *
 *   <div appStickToBottom [stickTrigger]="messages.length" [stickKey]="chatId">
 *
 * - It follows new messages only while you are already near the bottom, so
 *   reading history isn't interrupted.
 * - `stickKey` changing (a different chat) jumps to the bottom regardless.
 * - `stickForce` true (your own message just arrived) jumps regardless.
 * - The container shrinking (phone keyboard opening) or images loading in
 *   keeps the bottom in view instead of hiding the latest line.
 */
@Directive({
  selector: '[appStickToBottom]',
  standalone: true,
})
export class StickToBottomDirective implements OnChanges, AfterViewInit, OnDestroy {
  @Input() stickTrigger: unknown;
  @Input() stickKey: unknown;
  @Input() stickForce = false;

  /** Within this many px of the bottom counts as "at the bottom". */
  private static readonly THRESHOLD = 96;

  private atBottom = true;
  private resizeObserver?: ResizeObserver;
  private readonly onMediaLoad = () => {
    if (this.atBottom) this.scrollNow();
  };

  constructor(
    private readonly el: ElementRef<HTMLElement>,
    private readonly zone: NgZone
  ) {}

  @HostListener('scroll')
  onScroll(): void {
    const e = this.el.nativeElement;
    this.atBottom = e.scrollHeight - e.scrollTop - e.clientHeight <= StickToBottomDirective.THRESHOLD;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['stickKey'] && !changes['stickKey'].firstChange) {
      this.atBottom = true;
    }
    if (this.atBottom || this.stickForce) {
      this.atBottom = true;
      this.scheduleScroll();
    }
  }

  ngAfterViewInit(): void {
    const host = this.el.nativeElement;
    this.zone.runOutsideAngular(() => {
      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => {
          if (this.atBottom) this.scrollNow();
        });
        this.resizeObserver.observe(host);
      }
      // load/loadedmetadata don't bubble; capture them from images and video.
      host.addEventListener('load', this.onMediaLoad, true);
      host.addEventListener('loadedmetadata', this.onMediaLoad, true);
    });
    this.scheduleScroll();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    const host = this.el.nativeElement;
    host.removeEventListener('load', this.onMediaLoad, true);
    host.removeEventListener('loadedmetadata', this.onMediaLoad, true);
  }

  private scheduleScroll(): void {
    // After Angular has rendered the new rows.
    this.zone.runOutsideAngular(() => requestAnimationFrame(() => this.scrollNow()));
  }

  private scrollNow(): void {
    const e = this.el.nativeElement;
    e.scrollTop = e.scrollHeight;
  }
}
