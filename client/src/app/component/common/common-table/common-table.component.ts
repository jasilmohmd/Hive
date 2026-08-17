import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { TableAction, TableColumn } from '../../../interface/table.interface';
import { CommonDropdownComponent } from '../common-dropdown/common-dropdown.component';

@Component({
  selector: 'app-common-table',
  standalone: true,
  imports: [CommonModule,CommonDropdownComponent],
  templateUrl: './common-table.component.html',
  styleUrl: './common-table.component.css'
})
export class CommonTableComponent {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() primaryActions: TableAction[] = [];
  @Input() secondaryActions: TableAction[] = [];

  /** Panel styling for friends section; `default` keeps list-modal and other consumers unchanged. */
  @Input() appearance: 'default' | 'friends' = 'default';

  /** When false, the thead row is hidden (e.g. friends lists where column titles are redundant). */
  @Input() showColumnHeaders = true;

  /**
   * If true, fallback displays the first letter of the channel name.
   * If false, the fallback will be empty.
   */
  @Input() showFallbackInitial: boolean = true;

  /**
   * When true, clicking a data row (outside buttons/dropdown/links) emits `rowClick`.
   * Leave false for list-modal and other consumers.
   */
  @Input() enableRowClick = false;

  @Output() rowClick = new EventEmitter<any>();

  dropdownOpen: any = null;

  constructor(private elementRef: ElementRef) {}

   // When toggling, set the dropdown open state for that row.
   toggleDropdown(row: any): void {
    if (this.dropdownOpen === row) {
      this.dropdownOpen = null;
    } else {
      this.dropdownOpen = row;
    }
  }

  onSecondaryAction(act: TableAction, row: any): void {
    act.action(row);
    this.dropdownOpen = null;
  }

  onRowActivate(event: MouseEvent, row: any): void {
    if (!this.enableRowClick) return;
    const el = event.target as HTMLElement | null;
    if (!el) return;
    if (el.closest('button, .dropdown-container, a, input, select, textarea, label')) {
      return;
    }
    const td = el.closest('td');
    const tr = el.closest('tr');
    if (!td || !tr) return;
    const cells = Array.from(tr.querySelectorAll(':scope > td'));
    const idx = cells.indexOf(td);
    const actionsColIndex = cells.length - 1;
    if (idx < 0 || idx === actionsColIndex) return;
    this.rowClick.emit(row);
  }

  // Listen for document clicks to close dropdown if clicking outside.
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // If click is outside the component, close dropdown.
    if (this.dropdownOpen && !(event.target as HTMLElement).closest('.dropdown-container')) {
      this.dropdownOpen = null;
    }
  }

}
