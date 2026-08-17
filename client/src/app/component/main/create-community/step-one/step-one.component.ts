import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'community-create-step-one',
  standalone: true,
  imports: [ReactiveFormsModule,CommonModule],
  templateUrl: './step-one.component.html',
  styleUrl: './step-one.component.css'
})
export class CommunityCreateStepOneComponent {
  @Input() formGroup!: FormGroup;
  @Output() next = new EventEmitter<void>();
  

  constructor(private router: Router) {}

  nextStep() {
    // Optionally, you can validate the step before navigating.
    this.next.emit();
  }

}
