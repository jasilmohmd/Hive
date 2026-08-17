import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IPollSummary } from '../../../services/chat.service';

@Component({
  selector: 'app-chat-message-poll',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-message-poll.component.html',
})
export class ChatMessagePollComponent {
  @Input({ required: true }) poll!: IPollSummary;
  @Input() disabled = false;
  @Output() vote = new EventEmitter<number[]>();

  selected = new Set<number>();

  toggleOption(index: number): void {
    if (this.disabled || this.poll.myVotes.length > 0) return;
    if (this.poll.allowMultiple) {
      if (this.selected.has(index)) {
        this.selected.delete(index);
      } else {
        this.selected.add(index);
      }
    } else {
      this.selected.clear();
      this.selected.add(index);
    }
  }

  isSelected(index: number): boolean {
    if (this.poll.myVotes.length > 0) {
      return this.poll.myVotes.includes(index);
    }
    return this.selected.has(index);
  }

  submitVote(): void {
    if (this.poll.myVotes.length > 0) return;
    const indexes = [...this.selected].sort((a, b) => a - b);
    if (!indexes.length) return;
    this.vote.emit(indexes);
  }

  totalVotes(): number {
    return this.poll.totalVotes;
  }

  percent(count: number): number {
    const t = this.totalVotes();
    if (!t) return 0;
    return Math.round((count / t) * 100);
  }
}
