import { firstValueFrom } from 'rxjs';
import { ChatService } from '../services/chat.service';
import {
  ChatUploadKind,
  DOCUMENT_ACCEPT,
  validateFileForUpload,
} from './chat-attachment';
import { ILocationMessageContent } from './message-display';

export interface ChatAttachmentHostState {
  attachMenuOpen: boolean;
  mediaPickerOpen: boolean;
  locationPickerOpen: boolean;
  pendingFile: File | null;
  pendingUploadKind: ChatUploadKind | null;
  attachError: string | null;
}

export function closeAllAttachPanels(state: ChatAttachmentHostState): void {
  state.attachMenuOpen = false;
  state.mediaPickerOpen = false;
  state.locationPickerOpen = false;
}

export function clearPendingAttach(state: ChatAttachmentHostState): void {
  state.pendingFile = null;
  state.pendingUploadKind = null;
  state.attachError = null;
}

export function onAttachFileChosen(
  state: ChatAttachmentHostState,
  file: File | null,
  kind: ChatUploadKind
): void {
  state.attachError = null;
  if (!file) return;
  const err = validateFileForUpload(file, kind);
  if (err) {
    state.attachError = err;
    return;
  }
  state.pendingFile = file;
  state.pendingUploadKind = kind;
  closeAllAttachPanels(state);
}

export function triggerFileInput(input: HTMLInputElement | undefined): void {
  if (input) {
    input.value = '';
    input.click();
  }
}

export async function uploadComposerFile(
  chat: ChatService,
  chatId: string,
  file: File,
  kind: ChatUploadKind
): Promise<void> {
  if (kind === 'image') {
    await firstValueFrom(chat.sendImageMessage(chatId, file));
  } else if (kind === 'video') {
    await firstValueFrom(chat.sendVideoMessage(chatId, file));
  } else {
    await firstValueFrom(chat.sendFileMessage(chatId, file));
  }
}

export function sendLocationMessage(
  chat: ChatService,
  chatId: string,
  location: ILocationMessageContent
): void {
  chat.sendMessage(chatId, JSON.stringify(location), 'location');
}

export const DOCUMENT_INPUT_ACCEPT = DOCUMENT_ACCEPT;
