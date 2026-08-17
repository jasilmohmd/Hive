import { TestBed } from '@angular/core/testing';

import { CommunityStateService } from './community-state.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('CommunityStateService', () => {
  let service: CommunityStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CommunityStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
