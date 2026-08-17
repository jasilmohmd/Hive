import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DropdownItem } from '../../../interface/dropdown.interface';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-common-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './common-dropdown.component.html',
  styleUrl: './common-dropdown.component.css'
})
export class CommonDropdownComponent {
  @Input() items: DropdownItem[] = [];
  // Two-way binding for open state
  @Input() isOpen: boolean = false;
  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() itemSelected = new EventEmitter<DropdownItem>();

  toggle(event: MouseEvent): void {
    // Prevent propagation so that the document click listener does not immediately close it.
    event.stopPropagation();
    this.isOpen = !this.isOpen;
    this.isOpenChange.emit(this.isOpen);
  }

  selectItem(item: DropdownItem, event: MouseEvent): void {
    event.stopPropagation();
    this.itemSelected.emit(item);
    this.isOpen = false;
    this.isOpenChange.emit(this.isOpen);
  }
  
}
