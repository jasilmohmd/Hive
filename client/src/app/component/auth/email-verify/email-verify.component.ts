import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserAuthService } from '../../../services/user-auth.service';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { ButtonComponent } from '../../common/button/button.component';
import { ErrorAlertComponent } from '../../common/error-alert/error-alert.component';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-email-verify',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule, ButtonComponent, ErrorAlertComponent],
  templateUrl: './email-verify.component.html',
  styleUrl: './email-verify.component.css',
})
export class EmailVerifyComponent implements OnInit {
  emailVerifyForm: FormGroup;
  errorMessage = '';
  mode = '';
  isSubmitting = false;

  userAuthService = inject(UserAuthService);
  private toast = inject(ToastService);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.emailVerifyForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.mode = params['mode'] || 'register';
    });
  }

  onSubmit(): void {
    if (this.emailVerifyForm.invalid || this.isSubmitting) {
      return;
    }

    const email = this.emailVerifyForm.value.email;
    sessionStorage.setItem('otpEmail', email);

    this.errorMessage = '';
    this.isSubmitting = true;

    this.userAuthService
      .sendOtp(email, this.mode)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => {
          this.toast.success('OTP sent');
          localStorage.setItem('otpTimestamp', Date.now().toString());
          this.router.navigate(['/auth/otp'], { queryParams: { mode: this.mode } });
        },
        error: (error: Error) => {
          this.errorMessage = error.message || 'Could not send OTP';
        },
      });
  }
}
