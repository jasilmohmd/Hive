import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './component/common/toast-container/toast-container.component';
import { ConfirmDialogHostComponent } from './component/common/confirm-dialog-host/confirm-dialog-host.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, ToastContainerComponent, ConfirmDialogHostComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'client';
}
