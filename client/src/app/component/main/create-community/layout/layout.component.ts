import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommunityStateService } from '../../../../services/shared/community-state.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommunityCreateStepOneComponent } from '../step-one/step-one.component';
import { CommunityCreateStepTwoComponent } from '../step-two/step-two.component';
import { CommunityCreateStepThreeComponent } from '../step-three/step-three.component';
import { ImageService } from '../../../../services/image.service';
import { firstValueFrom } from 'rxjs';
import { CommunityService } from '../../../../services/community.service';
import { LoadingStateComponent } from '../../../common/loading-state/loading-state.component';

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
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class CreateCommunityLayoutComponent {
  communityForm: FormGroup;
  currentStep = 1;
  isSubmitting = false;
  uploadProgress: 'uploading' | 'creating' | 'success' | 'error' | null = null;
  errorMessage = '';


  @Output() close = new EventEmitter<void>();

  constructor( private fb: FormBuilder, private imageService: ImageService, private communityService:CommunityService,
    private communityState: CommunityStateService, private router: Router, private route: ActivatedRoute ) {

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
    if (this.isSubmitting) return;
    if (this.communityForm.valid) {
      try {
        this.isSubmitting = true;
        this.errorMessage = '';
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

        await this.createCommunity(data);
        this.communityState.notifyMembershipChanged();
        
        this.uploadProgress = 'success';

        

        this.isSubmitting = false;
        this.onCancel();
      } catch (error) {
        this.uploadProgress = 'error';
        this.errorMessage = error instanceof Error ? error.message : 'Could not create community. Please try again.';
      } finally {
        this.isSubmitting = false;
      }
    } else {
      this.communityForm.markAllAsTouched();
    }
  }

  async uploadImage(file: any, isPublic: boolean): Promise<string> {
    try {
      const response = await firstValueFrom(this.imageService.uploadImage(file, isPublic));
      return response;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      throw new Error(error.message);
    }
  }

  private async createCommunity(data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      this.communityService.createCommunity(data).subscribe({
        next: (res) => {
          console.log('Community created:', res);
          resolve();
        },
        error: (err) => {
          console.error('Creation failed:', err);
          reject(err);
        }
      });
    });
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
        this.communityForm.get('description')?.markAsTouched();
        return this.communityForm.get('name')!.valid &&
               this.communityForm.get('type')!.valid && this.communityForm.get('description')!.valid;
      case 2:
        this.communityForm.get('image')?.markAsTouched();
        this.communityForm.get('coverImage')?.markAsTouched();
        return this.communityForm.get('image')!.valid && 
               this.communityForm.get('coverImage')!.valid;
      default:
        return true;
    }
  }

  // method to close the modal if using a modal service
  @HostListener('document:keydown.escape')
  onEscape(): void {
    // Let an open cropper handle its own close control.
    if (!document.querySelector('app-image-cropper-modal')) this.onCancel();
  }

  onCancel(): void {
    if (!this.isSubmitting) {
      this.close.emit();
      if (this.route.snapshot.routeConfig?.path === 'community/create') {
        void this.router.navigate(['/main/discover']);
      }
    }
  }
}
