import React, { useState } from 'react';
import { Search } from 'lucide-react';
import type { DataTableProps } from '../../types/datatable.types';

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  onSearchChange,
  searchPlaceholder = 'Search...',
  emptyStateMessage = 'No records found',
  isLoading = false,
  className = '',
}: DataTableProps<T>) {
  const [searchValue, setSearchValue] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    onSearchChange?.(value);
  };

  const renderCellContent = (row: T, column: typeof columns[0]) => {
    if (column.render) {
      return column.render(row);
    }
    return row[column.accessorKey] ?? '-';
  };

  return (
    <div className={`rounded-3xl border border-slate-800 bg-slate-900 ${className}`}>
      {/* Header Control Bar */}
      {onSearchChange && (
        <div className="flex items-center justify-between border-b border-slate-800 p-6">
          <h2 className="text-xl font-semibold text-white">User Management</h2>
          <div className="relative w-full max-w-md">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchValue}
              onChange={handleSearchChange}
              placeholder={searchPlaceholder}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2.5 pl-11 pr-4 text-sm text-white placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500"></div>
          </div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-800">
                {columns.map((column, index) => (
                  <th
                    key={`${column.accessorKey}-${index}`}
                    className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 ${
                      column.headerClassName || ''
                    }`}
                  >
                    {column.headerLabel}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <svg
                        className="h-12 w-12 text-slate-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                      </svg>
                      <p className="text-base font-medium">{emptyStateMessage}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="transition-colors hover:bg-slate-800/50"
                  >
                    {columns.map((column, colIndex) => (
                      <td
                        key={`${rowIndex}-${column.accessorKey}-${colIndex}`}
                        className={`px-6 py-4 text-sm ${column.className || ''}`}
                      >
                        {renderCellContent(row, column)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile Card View - Hidden on Desktop */}
      <div className="block p-4 lg:hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-slate-500">
            <svg
              className="h-12 w-12 text-slate-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <p className="text-base font-medium">{emptyStateMessage}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className="rounded-xl border border-slate-800 bg-slate-800/50 p-4"
              >
                {columns.map((column, colIndex) => (
                  <div
                    key={`mobile-${rowIndex}-${column.accessorKey}-${colIndex}`}
                    className="mb-3 last:mb-0"
                  >
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {column.headerLabel}
                    </div>
                    <div className="text-sm text-white">
                      {renderCellContent(row, column)}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
