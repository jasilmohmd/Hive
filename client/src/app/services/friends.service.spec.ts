import { TestBed } from '@angular/core/testing';

import { FriendService } from './friends.service';

describe('FriendsService', () => {
  let service: FriendService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FriendService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
