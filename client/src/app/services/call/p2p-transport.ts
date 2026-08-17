import { Subject } from 'rxjs';
import {
  acquireLocalMedia,
  prepareDevicesForCapture,
  stopPeerConnectionTracks,
  stopStreamTracks,
  type MediaCallType,
} from './media-capture';
import {
  ICallTransport,
  IJoinTransportOptions,
  TransportCallType,
} from './call-transport.interface';

export class P2pTransport implements ICallTransport {
  private stream: MediaStream | null = null;
  private pc: RTCPeerConnection | null = null;
  private remoteDescriptionSet = false;
  private pendingIceCandidates: RTCIceCandidateInit[] = [];
  private onIceCandidate: ((c: RTCIceCandidateInit) => void) | null = null;
  private onConnectionFailed: (() => void) | null = null;

  readonly remoteStream$ = new Subject<MediaStream | null>();

  get localStream(): MediaStream | null {
    return this.stream;
  }

  async acquireLocalMedia(callType: TransportCallType): Promise<void> {
    await prepareDevicesForCapture(callType, this.stream, this.pc);
    this.stream = await acquireLocalMedia(callType as MediaCallType);
  }

  releaseLocalMedia(): void {
    this.closePeerConnection();
    stopStreamTracks(this.stream);
    this.stream = null;
  }

  createPeerConnection(iceServers: RTCConfiguration): RTCPeerConnection {
    this.closePeerConnection();
    this.remoteDescriptionSet = false;
    this.pendingIceCandidates = [];

    const pc = new RTCPeerConnection(iceServers);
    this.stream?.getTracks().forEach((track) => {
      if (this.stream) pc.addTrack(track, this.stream);
    });

    pc.onicecandidate = (ev) => {
      if (ev.candidate && this.onIceCandidate) {
        this.onIceCandidate(ev.candidate.toJSON());
      }
    };
    pc.ontrack = (ev) => {
      const stream = ev.streams[0] ?? new MediaStream([ev.track]);
      this.remoteStream$.next(stream);
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') {
        this.onConnectionFailed?.();
      }
    };

    this.pc = pc;
    return pc;
  }

  bindSignalingHandlers(opts: IJoinTransportOptions): void {
    this.onIceCandidate = opts.onIceCandidate;
    this.onConnectionFailed = opts.onConnectionFailed ?? null;
  }

  closePeerConnection(): void {
    stopPeerConnectionTracks(this.pc);
    this.pc?.close();
    this.pc = null;
    this.remoteDescriptionSet = false;
    this.pendingIceCandidates = [];
    this.remoteStream$.next(null);
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.pc) throw new Error('Peer connection not ready');
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    return offer;
  }

  async handleOffer(sdp: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.pc) throw new Error('Peer connection not ready');
    await this.pc.setRemoteDescription(new RTCSessionDescription(sdp));
    this.remoteDescriptionSet = true;
    await this.flushPendingIceCandidates();
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return answer;
  }

  async handleAnswer(sdp: RTCSessionDescriptionInit): Promise<void> {
    if (!this.pc) return;
    await this.pc.setRemoteDescription(new RTCSessionDescription(sdp));
    this.remoteDescriptionSet = true;
    await this.flushPendingIceCandidates();
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.pc || !this.remoteDescriptionSet) {
      this.pendingIceCandidates.push(candidate);
      return;
    }
    try {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch {
      /* ignore late/duplicate */
    }
  }

  toggleMic(): boolean {
    const track = this.stream?.getAudioTracks()[0];
    if (!track) return false;
    track.enabled = !track.enabled;
    return track.enabled;
  }

  toggleCam(): boolean {
    const track = this.stream?.getVideoTracks()[0];
    if (!track) return false;
    track.enabled = !track.enabled;
    return track.enabled;
  }

  private async flushPendingIceCandidates(): Promise<void> {
    if (!this.pc) return;
    const pending = [...this.pendingIceCandidates];
    this.pendingIceCandidates = [];
    for (const c of pending) {
      try {
        await this.pc.addIceCandidate(new RTCIceCandidate(c));
      } catch {
        /* ignore */
      }
    }
  }
}
