import { Observable } from 'rxjs';

export type TransportCallType = 'audio' | 'video';

export interface IJoinTransportOptions {
  callType: TransportCallType;
  onIceCandidate: (candidate: RTCIceCandidateInit) => void;
  onConnectionFailed?: () => void;
}

export interface ICallTransport {
  readonly localStream: MediaStream | null;
  readonly remoteStream$: Observable<MediaStream | null>;

  acquireLocalMedia(callType: TransportCallType): Promise<void>;
  releaseLocalMedia(): void;
  createPeerConnection(iceServers: RTCConfiguration): RTCPeerConnection;
  closePeerConnection(): void;
  createOffer(): Promise<RTCSessionDescriptionInit>;
  handleOffer(sdp: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit>;
  handleAnswer(sdp: RTCSessionDescriptionInit): Promise<void>;
  addIceCandidate(candidate: RTCIceCandidateInit): Promise<void>;
  toggleMic(): boolean;
  toggleCam(): boolean;
}
