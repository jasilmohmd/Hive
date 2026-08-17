import { Injectable, OnDestroy } from '@angular/core';

type RingMode = 'incoming' | 'outgoing' | null;

@Injectable({
  providedIn: 'root',
})
export class CallRingtoneService implements OnDestroy {
  private audioCtx: AudioContext | null = null;
  private mode: RingMode = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private activeOscillators: OscillatorNode[] = [];

  ngOnDestroy(): void {
    this.stop();
  }

  playIncoming(): void {
    this.start('incoming');
  }

  playOutgoing(): void {
    this.start('outgoing');
  }

  stop(): void {
    this.mode = null;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.activeOscillators.forEach((o) => {
      try {
        o.stop();
      } catch {
        /* already stopped */
      }
    });
    this.activeOscillators = [];
  }

  private start(mode: Exclude<RingMode, null>): void {
    if (this.mode === mode) return;
    this.stop();
    this.mode = mode;
    const ctx = this.getContext();
    if (!ctx) return;

    const playPulse = () => {
      if (this.mode !== mode) return;
      if (mode === 'incoming') {
        this.playTone(ctx, 440, 0.35, 0.12);
        setTimeout(() => {
          if (this.mode === mode) this.playTone(ctx, 480, 0.35, 0.1);
        }, 450);
      } else {
        this.playTone(ctx, 520, 0.25, 0.08);
      }
    };

    playPulse();
    this.intervalId = setInterval(playPulse, mode === 'incoming' ? 2800 : 2200);
  }

  private getContext(): AudioContext | null {
    if (this.audioCtx) return this.audioCtx;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    this.audioCtx = new Ctx();
    return this.audioCtx;
  }

  private playTone(ctx: AudioContext, freq: number, durationSec: number, gainPeak: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const t0 = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(gainPeak, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + durationSec);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + durationSec + 0.05);
    this.activeOscillators.push(osc);
    osc.onended = () => {
      this.activeOscillators = this.activeOscillators.filter((o) => o !== osc);
    };
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }
  }
}
