export type MediaCallType = 'audio' | 'video';

const AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
};

const VIDEO_CONSTRAINTS: MediaTrackConstraints = { facingMode: 'user' };

export function isDeviceBusyError(err: unknown): boolean {
  const name = (err as DOMException)?.name ?? '';
  return (
    name === 'NotReadableError' ||
    name === 'TrackStartError' ||
    name === 'AbortError' ||
    name === 'OverconstrainedError'
  );
}

export function mediaErrorMessage(err: unknown, callType: MediaCallType): string {
  const name = (err as DOMException)?.name ?? '';
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'Microphone/camera permission denied';
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return callType === 'video' ? 'No camera or microphone found' : 'No microphone found';
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return callType === 'video'
      ? 'Camera is in use — close other apps using the camera, end any call, then try again'
      : 'Microphone is in use — end the call and close the voice recorder, then try again';
  }
  return (err as Error)?.message || 'Could not access microphone or camera';
}

export function stopStreamTracks(stream: MediaStream | null): void {
  stream?.getTracks().forEach((t) => t.stop());
}

export function stopPeerConnectionTracks(pc: RTCPeerConnection | null): void {
  if (!pc) return;
  pc.getSenders().forEach((s) => s.track?.stop());
  pc.getReceivers().forEach((r) => r.track?.stop());
}

export async function prepareDevicesForCapture(
  callType: MediaCallType,
  localStream: MediaStream | null,
  pc: RTCPeerConnection | null
): Promise<void> {
  stopStreamTracks(localStream);
  stopPeerConnectionTracks(pc);
  if (pc) {
    pc.close();
  }
  const ms = callType === 'video' ? 350 : 100;
  await new Promise((r) => setTimeout(r, ms));
}

async function acquireAudioStream(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: AUDIO_CONSTRAINTS,
    video: false,
  });
}

async function acquireVideoStreamCombined(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: AUDIO_CONSTRAINTS,
    video: VIDEO_CONSTRAINTS,
  });
}

/** Sequential audio then video — helps Windows after a voice call. */
async function acquireVideoStreamSequential(): Promise<MediaStream> {
  const audioStream = await navigator.mediaDevices.getUserMedia({
    audio: AUDIO_CONSTRAINTS,
    video: false,
  });
  try {
    const videoStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: VIDEO_CONSTRAINTS,
    });
    for (const track of videoStream.getVideoTracks()) {
      audioStream.addTrack(track);
    }
    videoStream.getTracks().forEach((t) => {
      if (!audioStream.getTracks().includes(t)) t.stop();
    });
    return audioStream;
  } catch (err) {
    stopStreamTracks(audioStream);
    throw err;
  }
}

/** Mic-only last resort for same-PC two-browser testing. */
async function acquireVideoStreamMicOnly(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({ audio: AUDIO_CONSTRAINTS, video: false });
}

export async function acquireLocalMedia(callType: MediaCallType): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Microphone/camera not supported in this browser');
  }

  if (callType === 'audio') {
    return acquireAudioStream();
  }

  try {
    return await acquireVideoStreamCombined();
  } catch (first) {
    if (!isDeviceBusyError(first)) {
      throw new Error(mediaErrorMessage(first, 'video'));
    }
  }

  await new Promise((r) => setTimeout(r, 250));

  try {
    return await acquireVideoStreamSequential();
  } catch (second) {
    if (!isDeviceBusyError(second)) {
      throw new Error(mediaErrorMessage(second, 'video'));
    }
  }

  try {
    return await acquireVideoStreamMicOnly();
  } catch (third) {
    throw new Error(mediaErrorMessage(third, 'video'));
  }
}
