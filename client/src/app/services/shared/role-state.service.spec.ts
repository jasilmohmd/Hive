import { TestBed } from '@angular/core/testing';

import { RoleStateService } from './role-state.service';

describe('RoleStateService', () => {
  let service: RoleStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RoleStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
