import { Component, inject } from '@angular/core';
import { UserProfileService } from '../../../../services/user-profile.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { ButtonComponent } from '../../../common/button/button.component';
import { ErrorAlertComponent } from '../../../common/error-alert/error-alert.component';
import { ToastService } from '../../../../services/toast.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, ErrorAlertComponent],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css',
})
export class ChangePasswordComponent {
  changePasswordForm: FormGroup;
  errorMessage = '';
  isSubmitting = false;

  private toast = inject(ToastService);

  constructor(
    private fb: FormBuilder,
    private userProfileService: UserProfileService,
    private router: Router
  ) {
    this.changePasswordForm = this.fb.group(
      {
        oldPassword: ['', [Validators.required, Validators.minLength(6)]],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordsValidator() }
    );
  }

  private passwordsValidator(): ValidatorFn {
    return (group: AbstractControl): { [key: string]: boolean } | null => {
      const oldPassword = group.get('oldPassword')?.value;
      const newPassword = group.get('newPassword')?.value;
      const confirmPassword = group.get('confirmPassword')?.value;
      const errors: Record<string, boolean> = {};

      if (oldPassword && newPassword && oldPassword === newPassword) {
        errors['sameAsOld'] = true;
      }

      if (newPassword && confirmPassword && newPassword !== confirmPassword) {
        errors['mismatch'] = true;
      }

      return Object.keys(errors).length ? errors : null;
    };
  }

  updatePassword(): void {
    if (this.changePasswordForm.invalid || this.isSubmitting) {
      return;
    }
    const { oldPassword, newPassword } = this.changePasswordForm.value;
    this.errorMessage = '';
    this.isSubmitting = true;

    this.userProfileService
      .changePassword(oldPassword, newPassword)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: (res) => {
          this.toast.success(res.message || 'Password changed');
          this.router.navigate(['/main/profile'], { state: { successMessage: res.message } });
        },
        error: (err: Error) => {
          this.errorMessage = err.message || 'Could not change password';
        },
      });
  }
}
