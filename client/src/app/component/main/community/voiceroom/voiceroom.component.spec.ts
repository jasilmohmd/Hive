import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VoiceroomComponent } from './voiceroom.component';

describe('VoiceroomComponent', () => {
  let component: VoiceroomComponent;
  let fixture: ComponentFixture<VoiceroomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VoiceroomComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VoiceroomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
