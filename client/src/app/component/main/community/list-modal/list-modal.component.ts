// list-modal.component.ts
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { CommonTableComponent } from '../../../common/common-table/common-table.component';
import { TableAction, TableColumn } from '../../../../interface/table.interface';

interface CreateField {
  field: string;
  label: string;
  type?: string; // e.g. 'text', 'select', 'checkbox', 'number'
  options?: { value: string, label: string, disabled?: boolean }[];
  validators?: any[];
  errorMessages?: { [key: string]: string };
  defaultValue?: any;
  // Optional function that takes the current form values and returns a boolean.
  showIf?: (formValues: any) => boolean;
}

@Component({
  selector: 'app-list-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CommonTableComponent],
  templateUrl: './list-modal.component.html',
  styleUrls: ['./list-modal.component.css'],
})
export class ListModalComponent implements OnInit {
  @Input() title: string = 'Manage Items';
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() primaryActions: TableAction[] = [];
  @Input() secondaryActions: TableAction[] = [];
  @Input() filters: any[] = [];
  @Input() searchFields: string[] = [];

  /** A single add action for opening the create form. */
  @Input() addAction: TableAction | null = null;
  /**
   * An array defining the fields for the creation form.
   */
  @Input() createFields: CreateField[] = [];


  /**
   * Mode for the form: 'create' or 'edit'
   */
  @Input() mode: 'create' | 'edit' | 'add' | 'search' = 'create';

  @Input() showFallbackInitial: boolean = false;

  @Output() close = new EventEmitter<void>();
  @Output() action = new EventEmitter<{ action: string, item: any }>();

  @Output() searchChange = new EventEmitter<string>();


  searchQuery = '';
  activeFilters: any[] = [];

  // Flag to toggle between table view and create form view
  isCreating: boolean = false;

  isAdding: boolean = false;

  // Reactive form for create mode
  createForm!: FormGroup;

  private originalId?: string;

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void { }

  get filteredData(): any[] {
    // Ensure data is an array and filter out any undefined or null items.
    const safeData = Array.isArray(this.data) ? this.data.filter(item => item != null) : [];

    return safeData.filter(item => {
      // If no searchFields are provided, then default to true.
      const matchesSearch =
        this.searchFields.length === 0 ||
        this.searchFields.some(field =>
          String(item[field]).toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      const matchesFilters =
        this.activeFilters.length === 0 ||
        this.activeFilters.some(filter => {
          const filterDef = this.filters.find(f => f.value === filter);
          return filterDef?.matcher
            ? filterDef.matcher(item)
            : item[filterDef?.field] === filter;
        });
      return matchesSearch && matchesFilters;
    });
  }



  toggleFilter(filterValue: string) {
    const index = this.activeFilters.indexOf(filterValue);
    index === -1 ? this.activeFilters.push(filterValue) : this.activeFilters.splice(index, 1);
  }

  handleAction(event: any) {
    const action = event.action as TableAction;
    const item = event.item;
    this.action.emit({ action: action.label, item });
  }

  closeModal() {
    this.close.emit();
  }

  /** Initialize the reactive form dynamically based on createFields */
  startCreate() {
    if (this.mode === 'add') {
      this.isAdding = true;
      this.addAction?.action(null)
    } else if (this.createFields && this.createFields.length) {
      this.isCreating = true;
      const group: { [key: string]: any } = {};
      this.createFields.forEach(fieldDef => {
        let defaultValue: any;
        // For number fields, default to null if not provided.
        if (fieldDef.type === 'number') {
          defaultValue = fieldDef.defaultValue !== undefined ? fieldDef.defaultValue : null;
        } else {
          defaultValue = fieldDef.defaultValue !== undefined ? fieldDef.defaultValue : '';
        }
        // For select fields, if default is still empty/null, set first option as default.
        if (fieldDef.type === 'select' && fieldDef.options && fieldDef.options.length && (defaultValue === '' || defaultValue === null)) {
          defaultValue = fieldDef.options[0].value;
        }
        // For checkbox fields, default should be an array.
        else if (fieldDef.type === 'checkbox') {
          if (defaultValue === '' || defaultValue === null) {
            defaultValue = [];
          }
        }
        group[fieldDef.field] = [defaultValue, fieldDef.validators || []];
      });
      this.createForm = this.fb.group(group);
    }
  }

  /** Patch the form with provided data (used for editing) */
  patchForm(data: any): void {
    if (this.createForm) {
      this.createForm.patchValue(data);
      // Store the _id if available
      if (data && data._id) {
        this.originalId = data._id;
      }
    }
  }


  cancelCreate() {
    this.isCreating = false;
  }

  saveNewItem() {
    if (this.createForm.valid) {
      // Clone the form value so we can modify it.
      let formValue = { ...this.createForm.value };

      // Remove any fields that are not applicable based on their showIf condition.
      this.createFields.forEach(field => {
        if (field.showIf && !field.showIf(this.createForm.value)) {
          delete formValue[field.field];
        }
      });

      // Specifically, handle maxParticipants:
      if (formValue.type !== 'voiceroom') {
        delete formValue.maxParticipants;
      } else {
        if (formValue.maxParticipants === null || formValue.maxParticipants === '') {
          delete formValue.maxParticipants;
        } else {
          formValue.maxParticipants = Number(formValue.maxParticipants);
        }
      }

      // If we're in edit mode, merge the stored _id into the form value.
      if (this.mode === 'edit' && this.originalId) {
        formValue._id = this.originalId;
      }

      // Emit action based on the mode.
      const emittedAction = this.mode === 'edit' ? 'submitEdit' : 'create';
      this.action.emit({ action: emittedAction, item: formValue });
      this.isCreating = false;
    } else {
      this.createForm.markAllAsTouched();
    }
  }





  getErrorMessage(fieldName: string): string {
    const control = this.createForm.get(fieldName);
    if (control && control.errors) {
      const fieldDef = this.createFields.find(f => f.field === fieldName);
      if (fieldDef && fieldDef.errorMessages) {
        for (const errorKey in control.errors) {
          if (fieldDef.errorMessages[errorKey]) {
            return fieldDef.errorMessages[errorKey];
          }
        }
      }
      return 'Invalid value';
    }
    return '';
  }

  onCheckboxChange(event: any, fieldName: string) {
    const control = this.createForm.get(fieldName);
    if (!control) return;
    let selected: string[] = control.value || [];
    if (event.target.checked) {
      if (!selected.includes(event.target.value)) {
        selected.push(event.target.value);
      }
    } else {
      selected = selected.filter(v => v !== event.target.value);
    }
    control.setValue(selected);
  }

  isChecked(fieldName: string, optionValue: string): boolean {
    const control = this.createForm.get(fieldName);
    return !!(control && Array.isArray(control.value) && control.value.includes(optionValue));
  }
}
