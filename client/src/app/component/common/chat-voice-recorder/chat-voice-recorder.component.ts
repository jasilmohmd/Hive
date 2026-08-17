import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, OnDestroy, Output } from '@angular/core';
import { CallService } from '../../../services/call.service';

@Component({
  selector: 'app-chat-voice-recorder',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-voice-recorder.component.html',
})
export class ChatVoiceRecorderComponent implements OnDestroy {
  @Output() recorded = new EventEmitter<File>();
  @Output() dismiss = new EventEmitter<void>();

  private readonly call = inject(CallService);

  recording = false;
  error: string | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private maxTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnDestroy(): void {
    this.stopTracks();
  }

  async startRecording(): Promise<void> {
    this.error = null;
    if (this.call.isInCall()) {
      this.error = 'End the call before recording a voice message.';
      return;
    }
    this.call.releaseMediaDevices();
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = this.pickRecorderMime();
      this.mediaRecorder = mimeType
        ? new MediaRecorder(this.stream, { mimeType })
        : new MediaRecorder(this.stream);
      this.chunks = [];
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.chunks.push(e.data);
      };
      this.mediaRecorder.onstop = () => {
        const type = this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(this.chunks, { type });
        if (blob.size < 200) {
          this.error = 'Recording was empty. Check your microphone and try again.';
          this.stopTracks();
          return;
        }
        const ext = type.includes('ogg') ? 'ogg' : 'webm';
        const file = new File([blob], `voice-${Date.now()}.${ext}`, { type });
        this.recorded.emit(file);
        this.stopTracks();
      };
      this.mediaRecorder.start(250);
      this.recording = true;
      this.maxTimer = setTimeout(() => this.stopRecording(), 60_000);
    } catch (err) {
      this.error = this.micErrorMessage(err);
      this.stopTracks();
    }
  }

  stopRecording(): void {
    if (this.maxTimer) {
      clearTimeout(this.maxTimer);
      this.maxTimer = null;
    }
    if (this.mediaRecorder && this.recording) {
      this.mediaRecorder.stop();
      this.recording = false;
    }
  }

  private pickRecorderMime(): string | undefined {
    const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
    return candidates.find((t) => MediaRecorder.isTypeSupported(t));
  }

  private micErrorMessage(err: unknown): string {
    return (err as Error)?.message || 'Microphone access denied or unavailable.';
  }

  private stopTracks(): void {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.mediaRecorder = null;
  }
}
