import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'app-chat-media',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-media.component.html',
})
export class ChatMediaComponent implements OnDestroy {
  @Input() src = '';
  @Input() alt = 'Shared image';

  lightboxOpen = false;
  thumbnailError = false;

  @ViewChild('closeBtn') closeBtn?: ElementRef<HTMLButtonElement>;

  private lastFocus: HTMLElement | null = null;
  private previousOverflow = '';

  onThumbnailError(): void {
    this.thumbnailError = true;
  }

  openLightbox(): void {
    if (this.thumbnailError || !this.src) return;
    this.lastFocus = document.activeElement as HTMLElement;
    this.lightboxOpen = true;
    this.previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setTimeout(() => this.closeBtn?.nativeElement?.focus());
  }

  closeLightbox(): void {
    if (!this.lightboxOpen) return;
    this.lightboxOpen = false;
    document.body.style.overflow = this.previousOverflow;
    this.lastFocus?.focus?.();
    this.lastFocus = null;
  }

  ngOnDestroy(): void {
    if (this.lightboxOpen) {
      document.body.style.overflow = this.previousOverflow;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.lightboxOpen) {
      this.closeLightbox();
    }
  }

  isAbsoluteHttpUrl(url: string): boolean {
    return /^https?:\/\//i.test(url?.trim() ?? '');
  }
}
