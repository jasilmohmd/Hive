import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageCropperModalComponent } from './image-cropper-modal.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

describe('ImageCropperModalComponent', () => {
  let component: ImageCropperModalComponent;
  let fixture: ComponentFixture<ImageCropperModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageCropperModalComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImageCropperModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
