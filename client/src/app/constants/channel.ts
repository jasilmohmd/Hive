import { Validators } from "@angular/forms";

const channelCreateFields = [
  {
    field: 'name',
    label: 'Channel Name',
    type: 'text',
    validators: [Validators.required, Validators.minLength(3), Validators.maxLength(50)],
    errorMessages: {
      required: 'Channel name is required',
      minlength: 'Channel name must be at least 3 characters',
      maxlength: 'Channel name cannot exceed 50 characters'
    }
  },
  {
    field: 'description',
    label: 'Description',
    type: 'text',
    validators: [Validators.maxLength(500)],
    errorMessages: { maxlength: 'Description cannot exceed 500 characters' }
  },
  {
    field: 'topic',
    label: 'Topic',
    type: 'text',
    validators: [Validators.maxLength(100)],
    errorMessages: { maxlength: 'Topic cannot exceed 100 characters' }
  },
  {
    field: 'type',
    label: 'Type',
    type: 'select',
    options: [
      { value: 'info', label: 'Info' },
      { value: 'chatroom', label: 'Chatroom' },
      { value: 'voiceroom', label: 'Voice Room' }
    ],
    validators: [Validators.required],
    errorMessages: { required: 'Channel type is required' },
    defaultValue: 'info'
  },
  {
    field: 'maxParticipants',
    label: 'Max Participants',
    type: 'number',
    validators: [Validators.min(2), Validators.max(6)],
    errorMessages: {
      min: 'At least 2 participants required',
      max: 'Voice rooms support at most 6 participants',
    },
    // Only show this field if type === 'voiceroom'
    showIf: (values: any) => values.type === 'voiceroom'
  }
];

export default channelCreateFields