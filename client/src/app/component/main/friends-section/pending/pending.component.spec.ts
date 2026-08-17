import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { PendingComponent } from './pending.component';
import { FriendService } from '../../../../services/friends.service';

describe('PendingComponent', () => {
  let component: PendingComponent;
  let fixture: ComponentFixture<PendingComponent>;

  beforeEach(async () => {
    const friendSpy = jasmine.createSpyObj<FriendService>('FriendService', [
      'getPendingRequests',
      'acceptRequest',
      'rejectRequest',
    ]);
    friendSpy.getPendingRequests.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [PendingComponent],
      providers: [{ provide: FriendService, useValue: friendSpy }],
    })
    .compileComponents();

    fixture = TestBed.createComponent(PendingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
