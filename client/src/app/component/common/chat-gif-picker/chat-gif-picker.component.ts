import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';

interface GiphyImageSet {
  url?: string;
}

interface GiphyImages {
  downsized?: GiphyImageSet;
  fixed_height_small?: GiphyImageSet;
  downsized_still?: GiphyImageSet;
  fixed_height_small_still?: GiphyImageSet;
  preview_gif?: GiphyImageSet;
}

interface GiphyItem {
  images?: GiphyImages;
}

interface GiphyResponse {
  data?: GiphyItem[];
}

@Component({
  selector: 'app-chat-gif-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-gif-picker.component.html',
})
export class ChatGifPickerComponent implements OnInit, OnDestroy {
  /** `gif` → `/chat/gifs`; `sticker` → `/chat/stickers` (Giphy Sticker API). */
  @Input() mode: 'gif' | 'sticker' = 'gif';
  /** dm | channel — matches composer chrome */
  @Input() theme: 'dm' | 'channel' = 'dm';

  @Output() picked = new EventEmitter<string>();
  @Output() dismiss = new EventEmitter<void>();

  searchDraft = '';
  private readonly search$ = new Subject<string>();

  loading = false;
  error: string | null = null;
  results: string[] = [];

  private sub: Subscription | null = null;

  constructor(private http: HttpClient) {}

  get panelTitle(): string {
    return this.mode === 'sticker' ? 'Stickers' : 'GIFs';
  }

  get searchPlaceholder(): string {
    return this.mode === 'sticker' ? 'Search stickers…' : 'Search Giphy…';
  }

  get emptyLabel(): string {
    return this.mode === 'sticker' ? 'No stickers found' : 'No GIFs found';
  }

  get loadErrorHint(): string {
    return this.mode === 'sticker'
      ? 'Sticker search is unavailable. Check server GIPHY_API_KEY and try again.'
      : 'GIF search is unavailable. Check server GIPHY_API_KEY and try again.';
  }

  get genericLoadError(): string {
    return this.mode === 'sticker' ? 'Could not load stickers' : 'Could not load GIFs';
  }

  private pickPreviewUrl(item: GiphyItem): string | undefined {
    const img = item.images;
    if (!img) return undefined;
    const candidates = [
      img.downsized?.url,
      img.fixed_height_small?.url,
      img.downsized_still?.url,
      img.fixed_height_small_still?.url,
      img.preview_gif?.url,
    ];
    return candidates.find((u) => typeof u === 'string' && u.startsWith('https://'));
  }

  ngOnInit(): void {
    const path = this.mode === 'sticker' ? 'stickers' : 'gifs';
    const base = `${environment.apiUrl}/chat/${path}`;
    this.sub = this.search$
      .pipe(
        debounceTime(320),
        distinctUntilChanged(),
        switchMap((q) => {
          this.loading = true;
          this.error = null;
          let params = new HttpParams().set('limit', '24');
          const trimmed = q.trim();
          if (trimmed.length > 0) {
            params = params.set('q', trimmed);
          }
          return this.http.get<GiphyResponse>(base, { params });
        })
      )
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.error = null;
          const urls: string[] = [];
          for (const item of res.data ?? []) {
            const u = this.pickPreviewUrl(item);
            if (u) urls.push(u);
          }
          this.results = urls;
          if (!urls.length) {
            this.error = this.emptyLabel;
          }
        },
        error: (err: unknown) => {
          this.loading = false;
          this.results = [];
          if (err instanceof HttpErrorResponse) {
            const body = err.error as { message?: string } | null;
            const msg =
              typeof body?.message === 'string'
                ? body.message
                : err.status === 503 || err.status === 502
                  ? this.loadErrorHint
                  : this.genericLoadError;
            this.error = msg;
          } else {
            this.error = this.genericLoadError;
          }
        },
      });

    this.search$.next('');
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  onSearchInput(value: string): void {
    this.searchDraft = value;
    this.search$.next(value);
  }

  pickMedia(url: string): void {
    this.picked.emit(url);
  }

  onBackdropClick(): void {
    this.dismiss.emit();
  }
}
