import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UserAuthService } from '../../../services/user-auth.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { ButtonComponent } from '../../common/button/button.component';
import { ErrorAlertComponent } from '../../common/error-alert/error-alert.component';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule, ButtonComponent, ErrorAlertComponent],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.css',
})
export class LoginFormComponent {
  loginForm: FormGroup;
  errorMessage = '';
  isSubmitting = false;

  userAuthService = inject(UserAuthService);
  private toast = inject(ToastService);

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onLogin(): void {
    if (this.loginForm.invalid || this.isSubmitting) {
      return;
    }

    this.errorMessage = '';
    this.isSubmitting = true;

    this.userAuthService
      .userLogin(this.loginForm.value)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => {
          this.toast.success('Welcome back!');
          this.router.navigateByUrl('/main/discover');
        },
        error: (error: Error) => {
          this.errorMessage = error.message || 'Login failed';
        },
      });
  }
}
