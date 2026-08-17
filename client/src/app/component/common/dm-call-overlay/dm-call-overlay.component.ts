import {

  AfterViewInit,

  Component,

  ElementRef,

  Input,

  OnDestroy,

  OnInit,

  ViewChild,

} from '@angular/core';

import { CommonModule } from '@angular/common';

import { Subscription } from 'rxjs';

import { CallService, CallState, CallType } from '../../../services/call.service';



@Component({

  selector: 'app-dm-call-overlay',

  standalone: true,

  imports: [CommonModule],

  templateUrl: './dm-call-overlay.component.html',

  styleUrl: './dm-call-overlay.component.css',

})

export class DmCallOverlayComponent implements OnInit, OnDestroy, AfterViewInit {

  @Input() peerName = 'Friend';

  @ViewChild('localVideo') localVideoRef?: ElementRef<HTMLVideoElement>;

  @ViewChild('remoteVideo') remoteVideoRef?: ElementRef<HTMLVideoElement>;

  @ViewChild('remoteAudio') remoteAudioRef?: ElementRef<HTMLAudioElement>;



  callState: CallState = 'idle';

  callType: CallType = 'audio';

  muted = false;

  camOff = false;

  hasRemoteVideo = false;



  private subs = new Subscription();

  private pendingRemoteStream: MediaStream | null = null;



  constructor(public call: CallService) {}



  ngOnInit(): void {

    this.subs.add(

      this.call.callState$.subscribe((s) => {

        this.callState = s;

        if (s === 'idle') {
          this.clearMediaElements();
        }

        setTimeout(() => {

          this.syncLocalPreview();

          this.attachRemoteStream(this.pendingRemoteStream);

        }, 0);

      })

    );

    this.subs.add(

      this.call.callType$.subscribe((t) => {

        this.callType = t;

        setTimeout(() => this.attachRemoteStream(this.pendingRemoteStream), 0);

      })

    );

    this.subs.add(

      this.call.remoteStream$.subscribe((stream) => {

        this.pendingRemoteStream = stream;

        this.hasRemoteVideo = !!stream?.getVideoTracks().length;

        setTimeout(() => this.attachRemoteStream(stream), 0);

      })

    );

    this.syncLocalPreview();

  }



  ngAfterViewInit(): void {

    setTimeout(() => this.attachRemoteStream(this.pendingRemoteStream), 0);

  }



  ngOnDestroy(): void {

    this.subs.unsubscribe();

    this.clearMediaElements();

  }



  get visible(): boolean {

    return (

      this.callState === 'outgoing' ||

      this.callState === 'incoming' ||

      this.callState === 'connecting' ||

      this.callState === 'active' ||

      this.callState === 'unavailable'

    );

  }



  statusLabel(): string {

    switch (this.callState) {

      case 'outgoing':

        return 'Calling…';

      case 'connecting':

        return 'Connecting…';

      case 'active':

        return 'In call';

      case 'unavailable':

        return 'User is offline — unable to connect';

      default:

        return '';

    }

  }



  endCall(): void {

    this.clearMediaElements();

    this.call.endCall();

  }



  toggleMute(): void {

    this.muted = !this.call.toggleMute();

  }



  toggleCam(): void {

    this.camOff = !this.call.toggleCamera();

    this.syncLocalPreview();

  }



  private attachRemoteStream(stream: MediaStream | null): void {
    const audioEl = this.remoteAudioRef?.nativeElement;
    const videoEl = this.remoteVideoRef?.nativeElement;

    if (this.callType === 'audio') {
      if (videoEl) videoEl.srcObject = null;
      if (audioEl) {
        audioEl.srcObject = stream;
        if (stream) void audioEl.play().catch(() => undefined);
      }
      return;
    }

    if (audioEl) {
      audioEl.srcObject = null;
      audioEl.pause();
    }
    if (videoEl) {
      videoEl.srcObject = stream;
      if (stream) void videoEl.play().catch(() => undefined);
    }
  }



  private syncLocalPreview(): void {

    const stream = this.call.localMediaStream;

    const el = this.localVideoRef?.nativeElement;

    if (el && stream && this.callType === 'video') {

      el.srcObject = stream;

      el.muted = true;

      void el.play().catch(() => undefined);

    }

  }



  private clearMediaElements(): void {

    const audioEl = this.remoteAudioRef?.nativeElement;

    if (audioEl) audioEl.srcObject = null;

    const videoEl = this.remoteVideoRef?.nativeElement;

    if (videoEl) videoEl.srcObject = null;

    const localEl = this.localVideoRef?.nativeElement;

    if (localEl) localEl.srcObject = null;

    this.pendingRemoteStream = null;

  }

}


