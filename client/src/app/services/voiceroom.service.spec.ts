import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Subject } from 'rxjs';
import { VoiceroomService } from './voiceroom.service';
import { ChatService } from './chat.service';

describe('VoiceroomService mute / deafen', () => {
  let service: VoiceroomService;
  let setMic: jasmine.Spy;

  beforeEach(() => {
    const chat = {
      onSocketReady: () => undefined,
      sessionEnded$: new Subject<void>(),
      ensureSocket: () => ({ emit: () => undefined }),
    };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ChatService, useValue: chat },
      ],
    });
    service = TestBed.inject(VoiceroomService);

    // Just enough of a LiveKit Room for the mute paths and refreshParticipants.
    setMic = jasmine.createSpy('setMicrophoneEnabled').and.resolveTo();
    (service as unknown as { room: unknown }).room = {
      localParticipant: {
        identity: 'me',
        name: 'me',
        trackPublications: new Map(),
        getTrackPublication: () => undefined,
        setMicrophoneEnabled: setMic,
      },
      remoteParticipants: new Map(),
      activeSpeakers: [],
      // TestBed teardown destroys the service, which leaves the room.
      disconnect: jasmine.createSpy('disconnect').and.resolveTo(),
    };
  });

  it('publishes mute changes as a stream', async () => {
    const seen: boolean[] = [];
    service.localMuted$.subscribe((m) => seen.push(m));
    await service.toggleMute();
    expect(service.localMuted).toBeTrue();
    expect(setMic).toHaveBeenCalledWith(false);
    expect(seen).toEqual([false, true]);
  });

  it('deafening mutes the mic, and undeafening restores it', async () => {
    await service.toggleDeafen();
    expect(service.deafened).toBeTrue();
    expect(service.localMuted).toBeTrue();

    await service.toggleDeafen();
    expect(service.deafened).toBeFalse();
    expect(service.localMuted).toBeFalse();
  });

  it('undeafening leaves the mic muted if it was muted before', async () => {
    await service.toggleMute();
    await service.toggleDeafen();
    await service.toggleDeafen();
    expect(service.deafened).toBeFalse();
    expect(service.localMuted).toBeTrue();
  });

  it('unmuting while deafened undeafens too', async () => {
    await service.toggleDeafen();
    await service.toggleMute();
    expect(service.localMuted).toBeFalse();
    expect(service.deafened).toBeFalse();
  });
});
