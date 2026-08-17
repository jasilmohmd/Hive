import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ImageCroppedEvent, ImageCropperComponent, LoadedImage } from 'ngx-image-cropper';
import { DomSanitizer } from '@angular/platform-browser';
import { ChangeDetectorRef } from '@angular/core';
import { ImageCropperModalComponent } from '../../../common/image-cropper-modal/image-cropper-modal.component';


@Component({
  selector: 'community-create-step-two',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, ImageCropperModalComponent],
  templateUrl: './step-two.component.html',
  styleUrl: './step-two.component.css'
})
export class CommunityCreateStepTwoComponent implements OnInit {
  @Input() formGroup!: FormGroup;
  @Output() next = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

  @ViewChild('imageFileInput') imageFileInput!: ElementRef;
  @ViewChild('coverFileInput') coverFileInput!: ElementRef;

  @ViewChild(ImageCropperComponent) imageCropper!: ImageCropperComponent;

  imagePreview: string | null = null;
  coverPreview: string | null = null;

  private originalFileName: string | null = null;

  showImageCropper = false;
  showCoverCropper = false;
  currentCropperType: 'image' | 'cover' = 'image';
  imageChangedEvent: any = '';


  constructor(private sanitizer: DomSanitizer, private cdRef: ChangeDetectorRef) { }

  ngOnInit(): void {
    const imageValue = this.formGroup.get('image')?.value;
    if (imageValue) {
      if (imageValue instanceof File) {
        this.imagePreview = URL.createObjectURL(imageValue);
      } else if (typeof imageValue === 'string') {
        this.imagePreview = imageValue;
      }
    }

    const coverValue = this.formGroup.get('coverImage')?.value;
    if (coverValue) {
      if (coverValue instanceof File) {
        this.coverPreview = URL.createObjectURL(coverValue);
      } else if (typeof coverValue === 'string') {
        this.coverPreview = coverValue;
      }
    }
    this.cdRef.markForCheck();
  }


  onFileChange(event: any, controlName: string): void {
    this.imageChangedEvent = event;
    this.currentCropperType = controlName as 'image' | 'cover';

    // Store original file name from the event (if available)
    if (event.target.files && event.target.files.length > 0) {
      const file: File = event.target.files[0];
      this.originalFileName = file.name;
    }

    if (controlName === 'image') {
      this.showImageCropper = true;
    } else {
      this.showCoverCropper = true;
    }
  }

  removeImage(controlName: string, event: any ): void {
    if (controlName === 'image') {
      this.imagePreview = null;
      this.imageFileInput.nativeElement.value = '';
      this.formGroup.get('image')?.setValue(null);
      this.originalFileName = null;
    } else {
      this.coverPreview = null;
      this.coverFileInput.nativeElement.value = '';
      this.formGroup.get('coverImage')?.setValue(null);
      this.originalFileName = null;
    }

    event.stopPropagation()

  }

  handleCropDone(event: ImageCroppedEvent, type: 'image' | 'cover'): void {
    console.log(event);

    if (event.blob) {
      const fileName = this.originalFileName ? this.originalFileName : 'cropped-image.png';
      const file = new File([event.blob], fileName , { type: event.blob.type });
      const previewUrl = URL.createObjectURL(event.blob);
      if (type === 'image') {
        this.imagePreview = previewUrl;
        this.formGroup.get('image')?.setValue(file);
        this.showImageCropper = false;
      } else {
        this.coverPreview = previewUrl;
        this.formGroup.get('coverImage')?.setValue(file);
        this.showCoverCropper = false;
      }

    } else {
      // If no cropped result exists, simply hide the cropper.
      if (this.currentCropperType === 'image') {
        this.showImageCropper = false;
      } else {
        this.showCoverCropper = false;
      }
    }
 
    this.imageChangedEvent = null;
    this.cdRef.markForCheck();
  }



  cancelCrop() {
    this.showImageCropper = false;
    this.showCoverCropper = false;
    this.imageChangedEvent = null;

    if (this.currentCropperType === 'image') {
      this.imageFileInput.nativeElement.value = '';
    } else {
      this.coverFileInput.nativeElement.value = '';
    }
  }

  previousStep() {
    this.back.emit();
  }

  nextStep() {
    this.next.emit();
  }
}
