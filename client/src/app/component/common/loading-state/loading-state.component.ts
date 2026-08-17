import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-state.component.html',
  styleUrl: './loading-state.component.css',
})
export class LoadingStateComponent {
  /** spinner: inline spinner; skeleton: projected content or default pulse; overlay: full-screen dimmed */
  @Input() variant: 'spinner' | 'skeleton' | 'overlay' = 'spinner';
  @Input() message = '';
  /** Extra Tailwind classes */
  @Input() containerClass = '';
}
