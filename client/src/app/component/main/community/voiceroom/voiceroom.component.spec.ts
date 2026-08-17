import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VoiceroomComponent } from './voiceroom.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

describe('VoiceroomComponent', () => {
  let component: VoiceroomComponent;
  let fixture: ComponentFixture<VoiceroomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VoiceroomComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
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
