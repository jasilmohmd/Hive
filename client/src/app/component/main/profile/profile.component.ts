import { Component, inject, OnInit } from '@angular/core';
import { IUser } from '../../../models/user';
import { UserAuthService } from '../../../services/user-auth.service';
import { UserProfileService } from '../../../services/user-profile.service';
import { ChatService } from '../../../services/chat.service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../common/button/button.component';
import { ImagePickerMenuComponent } from '../../common/image-picker-menu/image-picker-menu.component';
import { ToastService } from '../../../services/toast.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [RouterLink, CommonModule, ButtonComponent, ImagePickerMenuComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  userData: IUser;
  errorMessage = '';
  successMessage = '';
  logoutSubmitting = false;

  userAuthService = inject(UserAuthService);
  private toast = inject(ToastService);
  private userProfileService = inject(UserProfileService);

  constructor(
    private router: Router,
    private chatService: ChatService
  ) {
    this.userData = {
      userName: '',
      email: '',
    };
  }

  ngOnInit(): void {
    if (history.state && history.state.successMessage) {
      this.successMessage = history.state.successMessage;
      this.toast.success(this.successMessage);
      history.replaceState({}, document.title);
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    }

    this.userAuthService.getUserDetails().subscribe((res: any) => {
      if (res) {
        this.userData = res.userData;
      }
    });
  }

  logout(): void {
    if (this.logoutSubmitting) return;
    this.logoutSubmitting = true;
    this.chatService.disconnect();
    this.userAuthService.handelLogout().pipe(finalize(() => (this.logoutSubmitting = false))).subscribe({
      next: () => {
        this.toast.success('Logged out');
        this.router.navigateByUrl('/auth/login');
      },
      error: (error: Error) => {
        this.errorMessage = error.message;
        this.toast.error(error.message || 'Logout failed');
      },
    });
  }

  get avatarInitials(): string {
    const n = this.userData?.userName?.trim();
    if (!n) return '?';
    return n.slice(0, 2).toUpperCase();
  }

  onAvatarUploaded(url: string): void {
    this.userProfileService.updateAvatar(url).subscribe({
      next: () => {
        this.userData.imageUrl = url;
        this.toast.success('Profile photo updated');
      },
      error: (err: Error) => {
        this.toast.error(err.message || 'Could not save photo');
      },
    });
  }

  onAvatarRemoved(): void {
    this.userProfileService.updateAvatar(null).subscribe({
      next: () => {
        this.userData.imageUrl = undefined;
        this.toast.success('Profile photo removed');
      },
      error: (err: Error) => {
        this.toast.error(err.message || 'Could not remove photo');
      },
    });
  }
}
