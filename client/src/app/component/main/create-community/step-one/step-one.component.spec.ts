import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommunityCreateStepOneComponent } from './step-one.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';

describe('CommunityCreateStepOneComponent', () => {
  let component: CommunityCreateStepOneComponent;
  let fixture: ComponentFixture<CommunityCreateStepOneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommunityCreateStepOneComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommunityCreateStepOneComponent);
    component = fixture.componentInstance;

    // These steps take the wizard's form as a required @Input; without it the
    // [formGroup] binding throws before the component can render.
    component.formGroup = new FormGroup({
      name: new FormControl(''),
      type: new FormControl('public'),
      description: new FormControl(''),
      image: new FormControl<File | null>(null),
      coverImage: new FormControl<File | null>(null),
      tags: new FormControl<string[]>([]),
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
