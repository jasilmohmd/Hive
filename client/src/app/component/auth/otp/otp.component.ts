import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserAuthService } from '../../../services/user-auth.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { ButtonComponent } from '../../common/button/button.component';
import { ErrorAlertComponent } from '../../common/error-alert/error-alert.component';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-otp',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule, ButtonComponent, ErrorAlertComponent],
  templateUrl: './otp.component.html',
  styleUrl: './otp.component.css',
})
export class OtpComponent implements OnInit, OnDestroy {
  otpForm: FormGroup;
  errorMessage = '';
  email = '';
  mode = '';
  countdown = 0;
  timer: ReturnType<typeof setInterval> | undefined;
  isSubmitting = false;
  isResending = false;

  userAuthService = inject(UserAuthService);
  private toast = inject(ToastService);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit(): void {
    this.email = sessionStorage.getItem('otpEmail') || '';
    this.route.queryParams.subscribe((params) => {
      this.mode = params['mode'] || 'register';
    });
    this.resumeCountdown();
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  resumeCountdown(): void {
    const storedTime = localStorage.getItem('otpTimestamp');

    if (storedTime) {
      const elapsedTime = Math.floor((Date.now() - parseInt(storedTime, 10)) / 1000);
      this.countdown = Math.max(60 - elapsedTime, 0);
    } else {
      this.countdown = 60;
      localStorage.setItem('otpTimestamp', Date.now().toString());
    }

    this.startCountdown();
  }

  startCountdown(): void {
    if (this.timer) clearInterval(this.timer);

    this.timer = setInterval(() => {
      if (this.countdown > 0) {
        this.countdown--;
      } else if (this.timer) {
        clearInterval(this.timer);
      }
    }, 1000);
  }

  resendOtp(): void {
    if (this.countdown > 0 || this.isResending) return;

    this.errorMessage = '';
    this.isResending = true;

    this.userAuthService
      .sendOtp(this.email, this.mode)
      .pipe(finalize(() => (this.isResending = false)))
      .subscribe({
        next: () => {
          this.toast.success('OTP sent');
          localStorage.setItem('otpTimestamp', Date.now().toString());
          this.resumeCountdown();
        },
        error: (error: Error) => {
          this.errorMessage = error.message || 'Could not resend OTP';
        },
      });
  }

  onSubmit(): void {
    if (this.otpForm.invalid || this.isSubmitting) {
      return;
    }

    const otp = this.otpForm.value.otp;

    if (!this.email) {
      this.errorMessage = 'Email is missing. Please restart the process.';
      return;
    }

    this.errorMessage = '';
    this.isSubmitting = true;

    this.userAuthService
      .otpVerification(this.email, otp)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => {
          this.toast.success('Verified');
          if (this.mode === 'forgot-password') {
            this.router.navigate(['/auth/change_pass']);
          } else {
            this.router.navigate(['/auth/register']);
          }
        },
        error: (error: Error) => {
          this.errorMessage = error.message || 'Verification failed';
        },
      });
  }
}
