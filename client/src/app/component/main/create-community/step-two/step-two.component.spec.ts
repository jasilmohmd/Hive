import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommunityCreateStepTwoComponent } from './step-two.component';

describe('CommunityCreateStepTwoComponent', () => {
  let component: CommunityCreateStepTwoComponent;
  let fixture: ComponentFixture<CommunityCreateStepTwoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommunityCreateStepTwoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommunityCreateStepTwoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
