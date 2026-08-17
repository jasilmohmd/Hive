import { Component, inject, OnInit } from '@angular/core';
import { UserAuthService } from '../../../services/user-auth.service';
import { Router } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { ButtonComponent } from '../../common/button/button.component';
import { ErrorAlertComponent } from '../../common/error-alert/error-alert.component';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-register-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, ButtonComponent, ErrorAlertComponent, RouterLink],
  templateUrl: './register-form.component.html',
  styleUrl: './register-form.component.css',
})
export class RegisterFormComponent implements OnInit {
  registerForm: FormGroup;
  errorMessage = '';
  email = '';
  isSubmitting = false;

  userAuthService = inject(UserAuthService);
  private toast = inject(ToastService);

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.registerForm = this.fb.group(
      {
        userName: ['', [Validators.required, Validators.minLength(3)]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  ngOnInit(): void {
    this.email = sessionStorage.getItem('otpEmail') || '';
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const form = control as FormGroup;
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  onRegister(): void {
    if (this.registerForm.invalid || this.isSubmitting) {
      return;
    }

    const email = this.email;
    const { userName, password, confirmPassword } = this.registerForm.value;
    const regObj = { email, userName, password, confirmPassword };

    this.errorMessage = '';
    this.isSubmitting = true;

    this.userAuthService
      .userRegister(regObj)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => {
          this.toast.success('Account created!');
          this.router.navigateByUrl('/main/discover');
        },
        error: (error: Error) => {
          this.errorMessage = error.message || 'Registration failed';
        },
      });
  }
}
