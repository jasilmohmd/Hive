import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.css'
})
export class LandingPageComponent implements AfterViewInit, OnDestroy {
  private lastScrollY = 0;
  private header: HTMLElement | null = null;

  /**
   * Bound once and kept. The previous version called .bind(this) again inside
   * ngOnDestroy, which produces a different function object — so the listener
   * was never actually removed and leaked on every visit to this page.
   */
  private readonly onScroll = (): void => {
    if (!this.header) return;
    const y = window.scrollY;
    this.header.style.transform = y > this.lastScrollY && y > 80 ? 'translateY(-100%)' : 'translateY(0)';
    this.lastScrollY = y;
  };

  ngAfterViewInit(): void {
    this.header = document.getElementById('header');
    if (this.header) {
      window.addEventListener('scroll', this.onScroll, { passive: true });
    }
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
  }
}
