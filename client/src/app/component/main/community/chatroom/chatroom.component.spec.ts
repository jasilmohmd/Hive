import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { ReplaySubject, Subject, of } from 'rxjs';

import { ChatroomComponent } from './chatroom.component';
import { ChatService } from '../../../../services/chat.service';
import { UserAuthService } from '../../../../services/user-auth.service';
import { ChannelStateService } from '../../../../services/shared/channel-state.service';
import { FriendService } from '../../../../services/friends.service';
import { IChannel } from '../../../../models/channel';

describe('ChatroomComponent', () => {
  let component: ChatroomComponent;
  let fixture: ComponentFixture<ChatroomComponent>;
  let parentParamMap$: ReplaySubject<ReturnType<typeof convertToParamMap>>;
  let childParamMap$: ReplaySubject<ReturnType<typeof convertToParamMap>>;

  beforeEach(async () => {
    parentParamMap$ = new ReplaySubject(1);
    childParamMap$ = new ReplaySubject(1);

    const incomingMessage$ = new Subject();
    const chatError$ = new Subject();
    const chatMock: Pick<
      ChatService,
      | 'getMessageHistory'
      | 'joinChat'
      | 'disconnect'
      | 'sendMessage'
      | 'sendImageMessage'
      | 'incomingMessage$'
      | 'chatError$'
    > = {
      getMessageHistory: jasmine.createSpy('getMessageHistory').and.returnValue(of([])),
      joinChat: jasmine.createSpy('joinChat'),
      disconnect: jasmine.createSpy('disconnect'),
      sendMessage: jasmine.createSpy('sendMessage'),
      sendImageMessage: jasmine.createSpy('sendImageMessage'),
      incomingMessage$: incomingMessage$ as ChatService['incomingMessage$'],
      chatError$: chatError$ as ChatService['chatError$'],
    };

    const authSpy = jasmine.createSpyObj<UserAuthService>('UserAuthService', ['getUserDetails']);
    authSpy.getUserDetails.and.returnValue(
      of({
        message: '',
        userData: { _id: 'user1', userName: 'tester', email: 't@test.com' },
      })
    );

    const channelStateSpy = jasmine.createSpyObj<ChannelStateService>('ChannelStateService', [
      'loadAccessibleChannels',
    ]);
    const mockChannels: IChannel[] = [
      {
        _id: 'chan1',
        communityId: 'comm1',
        name: 'general-chat',
        createdBy: 'user1',
        type: 'chatroom',
        allowedRoles: [],
      },
    ];
    channelStateSpy.loadAccessibleChannels.and.returnValue(of(mockChannels));

    const friendSpy = jasmine.createSpyObj<FriendService>('FriendService', ['getUserDetails']);
    friendSpy.getUserDetails.and.returnValue(
      of({ _id: 'other', userName: 'other', email: 'o@test.com', imageUrl: '' })
    );

    await TestBed.configureTestingModule({
      imports: [ChatroomComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            parent: { paramMap: parentParamMap$.asObservable() },
            paramMap: childParamMap$.asObservable(),
          },
        },
        { provide: ChatService, useValue: chatMock },
        { provide: UserAuthService, useValue: authSpy },
        { provide: ChannelStateService, useValue: channelStateSpy },
        { provide: FriendService, useValue: friendSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatroomComponent);
    component = fixture.componentInstance;

    parentParamMap$.next(convertToParamMap({ id: 'comm1' }));
    childParamMap$.next(convertToParamMap({ channelId: 'chan1' }));

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set channel title from loaded channel name', () => {
    expect(component.channelTitle).toBe('general-chat');
  });
});
