import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommunityCreateStepOneComponent } from './step-one.component';

describe('CommunityCreateStepOneComponent', () => {
  let component: CommunityCreateStepOneComponent;
  let fixture: ComponentFixture<CommunityCreateStepOneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommunityCreateStepOneComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommunityCreateStepOneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
