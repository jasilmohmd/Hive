import { MediaSessionService } from './media-session.service';
import { CallService } from './call.service';
import { VoiceroomService } from './voiceroom.service';
import { HttpClient } from '@angular/common/http';
import { ChatService } from './chat.service';
import { CallRingtoneService } from './call-ringtone.service';
import { throwError } from 'rxjs';

describe('Microphone ownership across direct calls and voice rooms', () => {
  it('rejects a second session and ignores an old release after a successor acquires', () => {
    const sessions = new MediaSessionService();
    const releaseFirst = sessions.acquire()!;
    expect(sessions.acquire()).toBeNull();
    releaseFirst();
    const releaseSecond = sessions.acquire()!;
    releaseFirst();
    expect(sessions.acquire()).toBeNull();
    releaseSecond();
    expect(sessions.acquire()).not.toBeNull();
  });

  it('blocks a direct call before connecting or acquiring media while a voice room owns devices', async () => {
    const sessions = new MediaSessionService();
    const releaseVoice = sessions.acquire()!;
    const chat = { onSocketReady: () => {}, connectRealtime: jasmine.createSpy('connect') };
    const call = new CallService(chat as unknown as ChatService,
      { stop: () => {} } as CallRingtoneService, {} as HttpClient, sessions);
    const errors: string[] = [];
    call.callError$.subscribe(message => errors.push(message));
    await call.startCall('chat', 'peer', 'audio');
    expect(errors[0]).toContain('Leave the voice room');
    expect(chat.connectRealtime).not.toHaveBeenCalled();
    releaseVoice();
  });

  it('blocks voice-room entry before requesting a token during a direct call', async () => {
    const sessions = new MediaSessionService();
    const releaseCall = sessions.acquire()!;
    const http = { post: jasmine.createSpy('post') };
    const voice = new VoiceroomService(http as unknown as HttpClient, {} as ChatService, sessions);
    await expectAsync(voice.join('room')).toBeRejectedWithError('End the direct call before joining a voice room.');
    expect(http.post).not.toHaveBeenCalled();
    releaseCall();
    expect(sessions.acquire()).not.toBeNull();
  });

  it('releases the reservation when a voice-room token request fails', async () => {
    const sessions = new MediaSessionService();
    const http = { post: () => throwError(() => new Error('Token unavailable')) };
    const voice = new VoiceroomService(http as unknown as HttpClient, {} as ChatService, sessions);
    await expectAsync(voice.join('room')).toBeRejectedWithError('Token unavailable');
    expect(sessions.acquire()).not.toBeNull();
  });
});
