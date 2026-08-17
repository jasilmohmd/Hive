import { TestBed } from '@angular/core/testing';

import { ChannelStateService } from './channel-state.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('ChannelStateService', () => {
  let service: ChannelStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ChannelStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
