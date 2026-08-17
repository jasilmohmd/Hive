import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { ImageCroppedEvent, ImageCropperComponent, OutputFormat } from 'ngx-image-cropper';

@Component({
  selector: 'app-image-cropper-modal',
  standalone: true,
  imports: [CommonModule, ImageCropperComponent],
  templateUrl: './image-cropper-modal.component.html',
  styleUrl: './image-cropper-modal.component.css'
})
export class ImageCropperModalComponent {
  @Input() imageChangedEvent: any;
  @Input() aspectRatio: number = 1;
  @Input() format: OutputFormat = 'png';
  @Output() done = new EventEmitter<ImageCroppedEvent>();
  @Output() cancel = new EventEmitter<void>();

  private croppedEvent: ImageCroppedEvent | null = null;

  @ViewChild(ImageCropperComponent) cropper!: ImageCropperComponent;

  constructor(private cdRef: ChangeDetectorRef) { }

  onImageLoaded(): void {
    // Optionally log or perform actions when the image is loaded.
  }

  onCropperReady(): void {
    // Optionally log or perform actions when the cropper is ready.
  }

  onImageCropped(event: ImageCroppedEvent): void {
    if (!event.blob) return;
    this.croppedEvent = event;
  }

  onDone(): void {
    const result: ImageCroppedEvent | null = this.croppedEvent;
    if (result) {
      this.done.emit(result);
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
