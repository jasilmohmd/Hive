import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommunityCreateStepThreeComponent } from './step-three.component';

describe('CommunityCreateStepThreeComponent', () => {
  let component: CommunityCreateStepThreeComponent;
  let fixture: ComponentFixture<CommunityCreateStepThreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommunityCreateStepThreeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommunityCreateStepThreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
