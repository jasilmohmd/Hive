import { TestBed } from '@angular/core/testing';

import { RoleStateService } from './role-state.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('RoleStateService', () => {
  let service: RoleStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RoleStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
