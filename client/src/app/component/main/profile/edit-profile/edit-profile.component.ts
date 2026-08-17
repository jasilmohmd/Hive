import { Component, inject } from '@angular/core';
import { UserProfileService } from '../../../../services/user-profile.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { ButtonComponent } from '../../../common/button/button.component';
import { ErrorAlertComponent } from '../../../common/error-alert/error-alert.component';
import { ToastService } from '../../../../services/toast.service';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, ErrorAlertComponent],
  templateUrl: './edit-profile.component.html',
  styleUrl: './edit-profile.component.css',
})
export class EditProfileComponent {
  editProfileForm: FormGroup;
  errorMessage = '';
  isSubmitting = false;

  private toast = inject(ToastService);

  constructor(
    private fb: FormBuilder,
    private userProfileService: UserProfileService,
    private router: Router
  ) {
    this.editProfileForm = this.fb.group({
      newUserName: ['', [Validators.required, Validators.minLength(3)]],
    });
  }

  updateProfile(): void {
    if (this.editProfileForm.invalid || this.isSubmitting) {
      return;
    }
    const newUserName = this.editProfileForm.value.newUserName;
    this.errorMessage = '';
    this.isSubmitting = true;

    this.userProfileService
      .editProfile(newUserName)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: (res) => {
          this.toast.success(res.message || 'Profile updated');
          this.router.navigate(['/main/profile'], { state: { successMessage: res.message } });
        },
        error: (err: Error) => {
          this.errorMessage = err.message || 'Update failed';
        },
      });
  }
}
