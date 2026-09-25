import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CallService, CallType, IIncomingCall } from '../../../services/call.service';
import { CallRingtoneService } from '../../../services/call-ringtone.service';
import { FriendService } from '../../../services/friends.service';
import { VoiceroomService } from '../../../services/voiceroom.service';

@Component({
  selector: 'app-incoming-call-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './incoming-call-modal.component.html',
  styleUrl: './incoming-call-modal.component.css',
})
export class IncomingCallModalComponent implements OnInit, OnDestroy {
  incoming: IIncomingCall | null = null;
  callerName = 'Friend';
  callType: CallType = 'audio';
  /** Voice room you're in right now, if any — accepting the call leaves it. */
  activeRoomName: string | null = null;
  inVoiceroom = false;

  private subs = new Subscription();

  constructor(
    private call: CallService,
    private router: Router,
    private friends: FriendService,
    private ringtone: CallRingtoneService,
    private voiceroom: VoiceroomService
  ) {}

  ngOnInit(): void {
    void this.call.connect().catch(() => undefined);

    this.subs.add(
      this.call.incomingCall$.subscribe((payload) => {
        this.incoming = payload;
        this.callType = payload.callType;
        this.loadCallerName(payload.callerId);
      })
    );

    this.subs.add(
      this.call.callEnded$.subscribe(() => {
        this.incoming = null;
      })
    );

    // Belt and braces: whatever ends the ring (hang-up, answered in another
    // tab, a local endCall), the modal goes with it rather than lingering
    // with an Accept button for a call that no longer exists.
    this.subs.add(
      this.call.callState$.subscribe((state) => {
        if (state !== 'incoming') this.incoming = null;
      })
    );

    this.subs.add(
      this.voiceroom.connected$.subscribe((c) => (this.inVoiceroom = c))
    );
    this.subs.add(
      this.voiceroom.activeChannelName$.subscribe((n) => (this.activeRoomName = n))
    );

    this.subs.add(
      this.call.callRejected$.subscribe(() => {
        this.incoming = null;
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private loadCallerName(callerId: string): void {
    this.friends.getUserDetails(callerId).subscribe({
      next: (u) => {
        this.callerName =
          typeof u.userName === 'string' && u.userName.trim()
            ? u.userName.trim()
            : 'Friend';
      },
      error: () => {
        this.callerName = 'Friend';
      },
    });
  }

  async accept(): Promise<void> {
    const inc = this.incoming;
    if (!inc) return;
    this.incoming = null;
    this.ringtone.stop();
    // Release the voice room's microphone *before* the call asks for it.
    // Navigating away used to trigger the room's leave as fire-and-forget, so
    // getUserMedia raced LiveKit for the device (HANDOFF #9, NotReadableError).
    // The modal says up front that accepting leaves the room.
    if (this.voiceroom.isConnected) {
      await this.voiceroom.leaveActiveCall();
    }
    await this.router.navigate(['/main/direct_message'], {
      queryParams: { friendId: inc.callerId },
    });
    await this.call.acceptCall(inc);
  }

  decline(): void {
    this.call.rejectCall();
    this.incoming = null;
  }

  callTypeLabel(): string {
    return this.callType === 'video' ? 'Video call' : 'Voice call';
  }
}
