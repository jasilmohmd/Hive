import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { ReplaySubject, Subject, of } from 'rxjs';

import { DirectMessageComponent } from './direct-message.component';
import { ChatService } from '../../../services/chat.service';
import { UserAuthService } from '../../../services/user-auth.service';
import { FriendService } from '../../../services/friends.service';

describe('DirectMessageComponent', () => {
  let component: DirectMessageComponent;
  let fixture: ComponentFixture<DirectMessageComponent>;
  let queryParamMap$: ReplaySubject<ReturnType<typeof convertToParamMap>>;

  beforeEach(async () => {
    queryParamMap$ = new ReplaySubject(1);

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
        userData: {
          _id: 'user1',
          userName: 'tester',
          email: 't@test.com',
          imageUrl: 'https://example.com/me.png',
        },
      })
    );

    const friendSpy = jasmine.createSpyObj<FriendService>('FriendService', ['getUserDetails']);
    friendSpy.getUserDetails.and.returnValue(
      of({
        _id: 'friend1',
        userName: 'pal',
        email: 'p@test.com',
        imageUrl: 'https://example.com/pal.png',
      })
    );

    await TestBed.configureTestingModule({
      imports: [DirectMessageComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: queryParamMap$.asObservable(),
          },
        },
        { provide: ChatService, useValue: chatMock },
        { provide: UserAuthService, useValue: authSpy },
        { provide: FriendService, useValue: friendSpy },
      ],
    }).compileComponents();

    queryParamMap$.next(convertToParamMap({}));

    fixture = TestBed.createComponent(DirectMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open chat and load history when friendId is present', () => {
    const chat = TestBed.inject(ChatService);
    queryParamMap$.next(convertToParamMap({ friendId: 'friend1' }));
    fixture.detectChanges();

    expect(component.friendId).toBe('friend1');
    expect(component.chatId).toBe(ChatService.directChatId('user1', 'friend1'));
    expect(chat.getMessageHistory).toHaveBeenCalledWith(component.chatId!);
  });
});
