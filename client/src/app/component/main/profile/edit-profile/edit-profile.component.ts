import { Component, OnInit, inject } from '@angular/core';
import { UserProfileService } from '../../../../services/user-profile.service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { ButtonComponent } from '../../../common/button/button.component';
import { ErrorAlertComponent } from '../../../common/error-alert/error-alert.component';
import { ToastService } from '../../../../services/toast.service';
import { UserAuthService } from '../../../../services/user-auth.service';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ButtonComponent, ErrorAlertComponent],
  templateUrl: './edit-profile.component.html',
  styleUrl: './edit-profile.component.css',
})
export class EditProfileComponent implements OnInit {
  editProfileForm: FormGroup;
  errorMessage = '';
  isSubmitting = false;

  private toast = inject(ToastService);
  private auth = inject(UserAuthService);

  constructor(
    private fb: FormBuilder,
    private userProfileService: UserProfileService,
    private router: Router
  ) {
    this.editProfileForm = this.fb.group({
      newUserName: ['', [Validators.required, Validators.minLength(3)]],
    });
  }

  /** Start from your current name rather than an empty box. */
  ngOnInit(): void {
    this.auth.getUserDetails().subscribe({
      next: (res) => {
        const name = res?.userData?.userName;
        const ctrl = this.editProfileForm.get('newUserName');
        if (name && ctrl && !ctrl.dirty) ctrl.setValue(name);
      },
      error: () => undefined,
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
          this.router.navigate(['/main/profile']);
        },
        error: (err: Error) => {
          this.errorMessage = err.message || 'Update failed';
        },
      });
  }
}
