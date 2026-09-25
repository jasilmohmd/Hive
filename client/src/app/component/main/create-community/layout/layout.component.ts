import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Output } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommunityCreateStepOneComponent } from '../step-one/step-one.component';
import { CommunityCreateStepTwoComponent } from '../step-two/step-two.component';
import { CommunityCreateStepThreeComponent } from '../step-three/step-three.component';
import { ImageService } from '../../../../services/image.service';
import { firstValueFrom } from 'rxjs';
import { CommunityService } from '../../../../services/community.service';
import { LoadingStateComponent } from '../../../common/loading-state/loading-state.component';
import { ErrorAlertComponent } from '../../../common/error-alert/error-alert.component';
import { CommunityStateService } from '../../../../services/shared/community-state.service';
import { ToastService } from '../../../../services/toast.service';

@Component({
  selector: 'create-community-layout',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CommunityCreateStepOneComponent,
    CommunityCreateStepTwoComponent,
    CommunityCreateStepThreeComponent,
    LoadingStateComponent,
    ErrorAlertComponent,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class CreateCommunityLayoutComponent {
  communityForm: FormGroup;
  currentStep = 1;
  isSubmitting = false;
  uploadProgress: 'uploading' | 'creating' | 'success' | 'error' | null = null;
  submitError: string | null = null;


  @Output() close = new EventEmitter<void>();

  constructor(
    private fb: FormBuilder,
    private imageService: ImageService,
    private communityService: CommunityService,
    private communityState: CommunityStateService,
    private toast: ToastService,
    private router: Router
  ) {

    this.communityForm = this.fb.group({
      // Step 1: Basic Info
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      type: ['public', [Validators.required]],
      description: ['', [Validators.maxLength(500)]],
      // Step 2: File uploads (image and coverImage)
      image: [null, Validators.required],
      coverImage: [null, Validators.required],
      // Step 3: Tags as an array (default empty array)
      tags: [[], [Validators.required, Validators.minLength(1)]] // We'll parse comma-separated tags into an array before submission.
    });

  }

  async onSubmit(): Promise<void> {
    if (this.communityForm.valid) {
      try {
        this.isSubmitting = true;
        this.submitError = null;
        this.uploadProgress = 'uploading';

        const formValue = { ...this.communityForm.value };
        
        // Upload images in parallel
        const [imageUrl, coverImageUrl] = await Promise.all([
          this.uploadImage(formValue.image, true),
          this.uploadImage(formValue.coverImage, true)
        ]);

        this.uploadProgress = 'creating';

        const { name, type, description, tags } = formValue;
        const data = { name, type, description, imageUrl, coverImageUrl, tags };

        const communityId = await this.createCommunity(data);

        this.uploadProgress = 'success';
        this.toast.success(`${name} is ready`);
        // The icon rail / Communities sheet only reloads on this signal; a new
        // community used to be missing from them until a full page reload.
        this.communityState.notifyMembershipChanged();
        this.dismiss(communityId ? ['/main/community', communityId] : null);
      } catch (error) {
        // Stop the full-screen overlay and let the user fix things and retry.
        // isSubmitting was never reset before, so a failure left the overlay
        // up for good ("An error occurred") with Cancel disabled behind it.
        this.uploadProgress = 'error';
        this.isSubmitting = false;
        this.submitError = (error as Error)?.message || 'Could not create the community. Please try again.';
      }
    } else {
      this.communityForm.markAllAsTouched();
    }
  }

  async uploadImage(file: any, isPublic: boolean): Promise<string> {
    try {
      return await firstValueFrom(this.imageService.uploadImage(file, isPublic));
    } catch (error: any) {
      throw new Error(error?.message || 'Image upload failed');
    }
  }

  /** Resolves with the new community's id (the API answers `{ community }`). */
  private async createCommunity(data: any): Promise<string | null> {
    const res: any = await firstValueFrom(this.communityService.createCommunity(data));
    return res?.community?._id ?? res?._id ?? null;
  }

  get overlayMessage(): string {
    switch (this.uploadProgress) {
      case 'uploading':
        return 'Uploading images...';
      case 'creating':
        return 'Creating community...';
      case 'success':
        return 'Community created successfully!';
      case 'error':
        return 'An error occurred. Please try again.';
      default:
        return 'Please wait...';
    }
  }

  goToStep(step: number): void {
    if (step < this.currentStep) {
      this.currentStep = step;
      return;
    }

    // Validate current step before proceeding
    const currentStepValid = this.validateCurrentStep();
    if (currentStepValid) {
      this.currentStep = step;
    }
  }

  private validateCurrentStep(): boolean {
    switch (this.currentStep) {
      case 1:
        this.communityForm.get('name')?.markAsTouched();
        this.communityForm.get('type')?.markAsTouched();
        return this.communityForm.get('name')!.valid && 
               this.communityForm.get('type')!.valid;
      case 2:
        this.communityForm.get('image')?.markAsTouched();
        this.communityForm.get('coverImage')?.markAsTouched();
        return this.communityForm.get('image')!.valid && 
               this.communityForm.get('coverImage')!.valid;
      default:
        return true;
    }
  }

  onCancel(): void {
    if (!this.isSubmitting) {
      this.dismiss(null);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.onCancel();
  }

  /**
   * Opened as a modal from the nav, the host listens to (close). Reached by
   * URL (/main/community/create) nothing does, so the close button did
   * nothing there — go somewhere instead.
   */
  private dismiss(navigateTo: unknown[] | null): void {
    if (this.close.observed) {
      this.close.emit();
      if (navigateTo) void this.router.navigate(navigateTo);
    } else {
      void this.router.navigate(navigateTo ?? ['/main/discover']);
    }
  }
}
