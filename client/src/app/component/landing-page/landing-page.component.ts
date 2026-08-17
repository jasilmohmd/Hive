import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.css'
})
export class LandingPageComponent {
  private lastScrollY = 0;
  private header: HTMLElement | null = null;

  ngAfterViewInit(): void {
    // Get the header element after the view is initialized
    this.header = document.getElementById('header');

    if (this.header) {
      // Add the scroll event listener
      window.addEventListener('scroll', this.onScroll.bind(this));
    }
  }

  private onScroll(): void {
    if (this.header) {
      if (window.scrollY > this.lastScrollY) {
        // Scrolling Down
        this.header.style.transform = 'translateY(-100%)';
      } else {
        // Scrolling Up
        this.header.style.transform = 'translateY(0)';
      }
      this.lastScrollY = window.scrollY;
    }
  }

  ngOnDestroy(): void {
    // Remove the event listener when the component is destroyed
    window.removeEventListener('scroll', this.onScroll.bind(this));
  }
}
