export interface DropdownItem {
  label: string;
  action: (item: any) => void; // The action to perform on selection
  icon?: string;               // Optional icon URL/path
  display?: 'icon' | 'label' | 'both'; // How to display the item; defaults to 'both'
  class?: string;              // Additional CSS classes for styling
}