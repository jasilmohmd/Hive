import {
  Directive,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';

export interface LongPressPoint {
  x: number;
  y: number;
}

/**
 * Emits `longPress` with the touch coordinates after the finger has been held
 * still on the element for `longPressDelay` ms.
 *
 * Why this exists: message actions (reply, react, forward, edit, delete) were
 * reachable only through the `contextmenu` event. Android Chrome synthesises
 * that from a long press, but iOS Safari does not for ordinary elements — it
 * starts a text selection instead — so on iPhone those five actions could not
 * be opened at all. This restores them without changing the desktop path.
 *
 * The press is abandoned if the finger travels more than MOVE_TOLERANCE_PX,
 * so scrolling the message list never trips it.
 *
 * Coordinates are captured at touchstart rather than read back when the timer
 * fires: a TouchEvent's `touches` list is empty once the finger is up, and
 * reading it late would anchor the menu at 0,0.
 */
@Directive({
  selector: '[appLongPress]',
  standalone: true,
})
export class LongPressDirective implements OnDestroy {
  /** Long enough not to fire on a tap, short enough not to feel broken. */
  @Input() longPressDelay = 500;

  @Output() longPress = new EventEmitter<LongPressPoint>();

  private static readonly MOVE_TOLERANCE_PX = 10;

  private timer: ReturnType<typeof setTimeout> | null = null;
  private origin: LongPressPoint | null = null;

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    // Ignore multi-touch — that is a pinch or a two-finger scroll, not a press.
    if (event.touches.length !== 1) {
      this.cancel();
      return;
    }
    const touch = event.touches[0];
    this.origin = { x: touch.clientX, y: touch.clientY };
    this.cancel();
    this.timer = setTimeout(() => {
      this.timer = null;
      if (this.origin) this.longPress.emit(this.origin);
    }, this.longPressDelay);
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    if (!this.origin || this.timer === null) return;
    const touch = event.touches[0];
    if (!touch) return;
    const moved =
      Math.abs(touch.clientX - this.origin.x) > LongPressDirective.MOVE_TOLERANCE_PX ||
      Math.abs(touch.clientY - this.origin.y) > LongPressDirective.MOVE_TOLERANCE_PX;
    if (moved) this.cancel();
  }

  @HostListener('touchend')
  @HostListener('touchcancel')
  onTouchEnd(): void {
    this.cancel();
  }

  ngOnDestroy(): void {
    this.cancel();
  }

  private cancel(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
