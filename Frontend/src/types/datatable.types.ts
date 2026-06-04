export interface DataTableColumn<T = any> {
  headerLabel: string;
  accessorKey: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T = any> {
  columns: DataTableColumn<T>[];
  data: T[];
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  emptyStateMessage?: string;
  isLoading?: boolean;
  className?: string;
}
