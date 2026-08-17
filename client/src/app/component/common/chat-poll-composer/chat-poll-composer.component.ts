import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-poll-composer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-poll-composer.component.html',
})
export class ChatPollComposerComponent {
  @Output() created = new EventEmitter<{ question: string; options: string[]; allowMultiple: boolean }>();
  @Output() dismiss = new EventEmitter<void>();

  question = '';
  options = ['', ''];
  allowMultiple = false;
  error: string | null = null;

  addOption(): void {
    if (this.options.length < 10) {
      this.options.push('');
    }
  }

  removeOption(index: number): void {
    if (this.options.length > 2) {
      this.options.splice(index, 1);
    }
  }

  submit(): void {
    const q = this.question.trim();
    const opts = this.options.map((o) => o.trim()).filter(Boolean);
    if (!q) {
      this.error = 'Enter a question.';
      return;
    }
    if (opts.length < 2) {
      this.error = 'Add at least 2 options.';
      return;
    }
    this.created.emit({ question: q, options: opts, allowMultiple: this.allowMultiple });
  }
}
