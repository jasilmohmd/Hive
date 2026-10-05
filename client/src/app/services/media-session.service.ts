import { Injectable } from '@angular/core';

/** Reserve microphone/camera ownership before any asynchronous call setup. */
@Injectable({ providedIn: 'root' })
export class MediaSessionService {
  private reservation: object | null = null;

  acquire(): (() => void) | null {
    if (this.reservation) return null;
    const reservation = {};
    this.reservation = reservation;
    return () => {
      // A delayed cleanup from an old session must not unlock its successor.
      if (this.reservation === reservation) this.reservation = null;
    };
  }
}
