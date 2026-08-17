import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IFileMessageContent } from '../../../util/message-display';
import { formatFileSize } from '../../../util/chat-attachment';

@Component({
  selector: 'app-chat-message-file',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-message-file.component.html',
})
export class ChatMessageFileComponent {
  @Input({ required: true }) file!: IFileMessageContent;

  formatSize(bytes: number): string {
    return formatFileSize(bytes);
  }

  fileIcon(): string {
    const mime = this.file.mime.toLowerCase();
    if (mime.includes('pdf')) return 'PDF';
    if (mime.includes('word') || mime.includes('document')) return 'DOC';
    if (mime.includes('sheet') || mime.includes('excel')) return 'XLS';
    if (mime.includes('presentation') || mime.includes('powerpoint')) return 'PPT';
    if (mime.includes('zip')) return 'ZIP';
    return 'FILE';
  }
}
