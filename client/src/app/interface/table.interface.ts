export interface TableColumn {
  header: string;
  field: string;
  // Optional function to format the cell value; if not provided, it uses row[field]
  cellFn?: (row: any) => string;
  isImage?: boolean; // If true, render cell as an image
}

export interface TableAction {
  label: string;
  action: (row: any) => void;
  class?: string;
  icon?: string; // URL/path to the icon image
  display?: 'icon' | 'label' | 'both'; // How to display the action (default: both)
}