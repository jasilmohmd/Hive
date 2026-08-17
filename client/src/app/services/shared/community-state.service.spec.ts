import { TestBed } from '@angular/core/testing';

import { CommunityStateService } from './community-state.service';

describe('CommunityStateService', () => {
  let service: CommunityStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CommunityStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
