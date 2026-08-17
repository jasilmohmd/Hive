import { Component, inject, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserAuthService } from '../../../services/user-auth.service';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { ButtonComponent } from '../../common/button/button.component';
import { ErrorAlertComponent } from '../../common/error-alert/error-alert.component';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, ButtonComponent, ErrorAlertComponent],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css',
})
export class ChangePasswordComponent implements OnInit {
  setNewPassForm: FormGroup;
  errorMessage = '';
  email = '';
  isSubmitting = false;

  userAuthService = inject(UserAuthService);
  private toast = inject(ToastService);

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.setNewPassForm = this.fb.group(
      {
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordsMatch }
    );
  }

  ngOnInit(): void {
    this.email = sessionStorage.getItem('otpEmail') || '';
  }

  private passwordsMatch(control: AbstractControl) {
    const group = control as FormGroup;
    const newPassword = group.get('newPassword');
    const confirmPassword = group.get('confirmPassword');

    if (!newPassword || !confirmPassword) return null;

    if (confirmPassword.errors && !confirmPassword.errors['mismatch']) {
      return null;
    }

    if (newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
    } else {
      confirmPassword.setErrors(null);
    }

    return null;
  }

  onSubmit(): void {
    if (this.setNewPassForm.invalid || this.isSubmitting) {
      return;
    }

    const email = this.email;
    const { newPassword, confirmPassword } = this.setNewPassForm.value;

    this.errorMessage = '';
    this.isSubmitting = true;

    this.userAuthService
      .setNewPassword(email, newPassword, confirmPassword)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => {
          this.toast.success('Password updated');
          this.router.navigateByUrl('/main/discover');
        },
        error: (error: Error) => {
          this.errorMessage = error.message || 'Could not update password';
        },
      });
  }
}
