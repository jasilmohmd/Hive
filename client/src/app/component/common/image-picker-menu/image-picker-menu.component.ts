import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { ImageCroppedEvent } from 'ngx-image-cropper';
import { finalize } from 'rxjs/operators';
import { ImageCropperModalComponent } from '../image-cropper-modal/image-cropper-modal.component';
import { ImageService } from '../../../services/image.service';

export type ImagePickerVariant = 'avatar' | 'cover';

@Component({
  selector: 'app-image-picker-menu',
  standalone: true,
  imports: [CommonModule, ImageCropperModalComponent],
  templateUrl: './image-picker-menu.component.html',
})
export class ImagePickerMenuComponent {
  private imageService = inject(ImageService);

  @Input() variant: ImagePickerVariant = 'avatar';
  /** Display URL (existing image). */
  @Input() src: string | null = null;
  @Input() editable = false;
  /** When true, emit removed when user clears photo (avatar flows only). */
  @Input() allowRemove = true;
  @Input() alt = 'Image';
  /** Tailwind size classes for avatar wrapper, e.g. `w-16 h-16 md:w-24 md:h-24` */
  @Input() avatarSizeClass = 'h-28 w-28';
  /** Initials when no image */
  @Input() fallbackLabel = '?';

  @Output() uploaded = new EventEmitter<string>();
  @Output() removed = new EventEmitter<void>();

  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  showCropper = false;
  imageChangedEvent: Event | null = null;
  private pendingFileName = 'photo.png';

  uploading = false;
  errorMessage = '';

  get aspectRatio(): number {
    return this.variant === 'avatar' ? 1 : 3;
  }

  triggerPick(): void {
    if (!this.editable || this.uploading) return;
    this.errorMessage = '';
    this.fileInput?.nativeElement.click();
  }

  onFileChange(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.pendingFileName = file.name;
    this.imageChangedEvent = ev;
    this.showCropper = true;
  }

  onCropCancel(): void {
    this.showCropper = false;
    this.imageChangedEvent = null;
    this.resetFileInput();
  }

  onCropDone(ev: ImageCroppedEvent): void {
    this.showCropper = false;
    this.imageChangedEvent = null;
    this.resetFileInput();
    if (!ev.blob) return;
    const file = new File(
      [ev.blob],
      this.pendingFileName || 'image.png',
      { type: ev.blob.type }
    );
    this.uploading = true;
    this.errorMessage = '';
    this.imageService
      .uploadImage(file, true)
      .pipe(finalize(() => (this.uploading = false)))
      .subscribe({
        next: (url) => this.uploaded.emit(url),
        error: (e: Error) => {
          this.errorMessage = e.message || 'Upload failed';
        },
      });
  }

  onRemove(): void {
    if (!this.allowRemove || this.uploading) return;
    this.removed.emit();
  }

  private resetFileInput(): void {
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }
}
