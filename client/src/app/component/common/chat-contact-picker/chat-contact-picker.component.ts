import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FriendService, IUser } from '../../../services/friends.service';

@Component({
  selector: 'app-chat-contact-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-contact-picker.component.html',
})
export class ChatContactPickerComponent implements OnInit {
  @Output() picked = new EventEmitter<IUser>();
  @Output() dismiss = new EventEmitter<void>();

  friends: IUser[] = [];
  loading = true;
  error: string | null = null;

  constructor(private friendsService: FriendService) {}

  ngOnInit(): void {
    this.friendsService.getAllFriends().subscribe({
      next: (list) => {
        this.friends = list ?? [];
        this.loading = false;
      },
      error: (e: Error) => {
        this.error = e.message;
        this.loading = false;
      },
    });
  }
}
