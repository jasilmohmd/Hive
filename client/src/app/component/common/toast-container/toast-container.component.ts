import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-container.component.html',
})
export class ToastContainerComponent {
  constructor(readonly toast: ToastService) {}
}
