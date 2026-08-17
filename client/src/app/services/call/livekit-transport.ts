import { Observable, of } from 'rxjs';
import {
  ICallTransport,
  IJoinTransportOptions,
  TransportCallType,
} from './call-transport.interface';

/**
 * LiveKit-backed transport for community voicerooms.
 * DM calls use P2pTransport only; voiceroom media is handled by VoiceroomService + livekit-client.
 */
export class LiveKitTransport implements ICallTransport {
  readonly localStream = null;
  readonly remoteStream$ = of(null);

  async acquireLocalMedia(_callType: TransportCallType): Promise<void> {
    throw new Error('Use VoiceroomService.join() for LiveKit rooms');
  }

  releaseLocalMedia(): void {
    /* VoiceroomService.leave() */
  }

  createPeerConnection(_iceServers: RTCConfiguration): RTCPeerConnection {
    throw new Error('LiveKit transport does not use RTCPeerConnection');
  }

  closePeerConnection(): void {
    /* no-op */
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    throw new Error('Not supported for LiveKit transport');
  }

  async handleOffer(_sdp: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    throw new Error('Not supported for LiveKit transport');
  }

  async handleAnswer(_sdp: RTCSessionDescriptionInit): Promise<void> {
    throw new Error('Not supported for LiveKit transport');
  }

  async addIceCandidate(_candidate: RTCIceCandidateInit): Promise<void> {
    /* no-op */
  }

  toggleMic(): boolean {
    return false;
  }

  toggleCam(): boolean {
    return false;
  }

  bindSignalingHandlers(_opts: IJoinTransportOptions): void {
    /* no-op */
  }
}
