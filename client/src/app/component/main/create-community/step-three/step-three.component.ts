import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommunityService } from '../../../../services/community.service';

@Component({
  selector: 'community-create-step-three',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './step-three.component.html',
  styleUrl: './step-three.component.css'
})
export class CommunityCreateStepThreeComponent implements OnInit {
  @Input() formGroup!: FormGroup;
  @Output() back = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();

  // Dummy available tags – replace with actual data or fetch from a service
  availableTags: any[] = [];
  filteredTags: any[] = [];
  loading = true;
  showTagError = false;
  searchControl = new FormControl('');
  errorMessage: string = '';

  constructor(private router: Router, private communityService: CommunityService) { }

  private setupSearch(): void {
    this.searchControl.valueChanges.subscribe(searchTerm => {
      if (!searchTerm) {
        this.filteredTags = [...this.availableTags];
        return;
      }
      const search = searchTerm.toLowerCase();
      this.filteredTags = this.availableTags.filter(tag => 
        tag.name.toLowerCase().includes(search)
      );
    });
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredTags = this.availableTags.filter(tag =>
      tag.name.toLowerCase().includes(value)
    );
  }

  ngOnInit(): void {
    this.loadTags();
    this.setupSearch();
  }

  // Fetch all friends
  loadTags(): void {

    this.communityService.getAllTags().subscribe({
      next: (response) => {
        this.availableTags = response; // Store the friends list
        this.filteredTags = response; // Default filtered list = full list
        this.loading = false;

      },
      error: (error) => {
        console.error('Error fetching tags:', error);
        this.errorMessage = 'Failed to load tags';
        this.loading = false;
      }
    });
  }


  toggleTag(tag: any): void {
    let currentTags = this.formGroup.get('tags')?.value || [];
    const tagId = tag._id;

    if (currentTags.includes(tagId)) {
      currentTags = currentTags.filter((id: string) => id !== tagId);
    } else {
      currentTags.push(tagId);
    }
    this.formGroup.get('tags')?.setValue(currentTags);
  }

  isTagSelected(tag: any): boolean {
    const currentTags = this.formGroup.get('tags')?.value || [];
    return currentTags.includes(tag._id);
  }

  get selectedTagsCount(): number {
    return this.formGroup.get('tags')?.value?.length || 0;
  }

  getTagClasses(tag: any): string {
    const base = 'rounded-full border transition-colors cursor-pointer ';
    return this.isTagSelected(tag)
      ? base + 'border-blue-500 bg-blue-500/10 hover:bg-blue-500/20'
      : base + 'border-zinc-700 hover:border-zinc-500 bg-zinc-800';
  }

  getCheckboxClasses(tag: any): string {
    const base = 'w-5 h-5 rounded-full flex items-center justify-center ';
    return this.isTagSelected(tag)
      ? base + 'bg-blue-500'
      : base + 'border-2 border-zinc-500';
  }

  previousStep() {
    this.back.emit();
  }

  submitForm() {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      this.showTagError = true;
      return;
    }
    this.next.emit();
  }

}
