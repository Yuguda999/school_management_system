import React, { useState, useMemo } from 'react';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  InboxIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import Card from './Card';

export interface Column<T> {
  key: keyof T | string;
  header: string | React.ReactNode;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  onRowClick?: (item: T) => void;
  actions?: (item: T) => React.ReactNode;
  emptyMessage?: string;
  searchPlaceholder?: string;
  pagination?: boolean;
  itemsPerPage?: number;
}

function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  searchable = true,
  filterable = false,
  onRowClick,
  actions,
  emptyMessage = "No data available",
  searchPlaceholder = "Search...",
  pagination = true,
  itemsPerPage = 10
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  // Filter data
  const filteredData = useMemo(() => {
    if (!searchTerm) return sortedData;

    return sortedData.filter(item =>
      Object.values(item).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [sortedData, searchTerm]);

  // Pagination
  const paginatedData = useMemo(() => {
    if (!pagination) return filteredData;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, pagination, itemsPerPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key, direction: 'asc' };
    });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) return <div className="w-4 h-4" />; // Placeholder for alignment
    return sortConfig.direction === 'asc' ?
      <ChevronUpIcon className="h-4 w-4 text-primary-600" /> :
      <ChevronDownIcon className="h-4 w-4 text-primary-600" />;
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="h-16 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50"></div>
        <div className="p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700/50 rounded-xl"></div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-0 shadow-lg ring-1 ring-black/5">
      {/* Header with search and filters */}
      {(searchable || filterable) && (
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {searchable && (
              <div className="relative max-w-md w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="input pl-10 py-2.5 bg-gray-50 dark:bg-gray-900 border-transparent focus:bg-white dark:focus:bg-gray-800 transition-all duration-200"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            )}

            {filterable && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`btn btn-outline btn-sm ${showFilters ? 'bg-primary-50 text-primary-600 border-primary-200' : ''}`}
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50/50 dark:bg-gray-800/50">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${column.sortable ? 'cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors' : ''}`}
                  style={{ width: column.width, textAlign: column.align }}
                  onClick={() => column.sortable && handleSort(String(column.key))}
                >
                  <div className={`flex items-center space-x-2 ${column.align === 'center' ? 'justify-center' : column.align === 'right' ? 'justify-end' : ''}`}>
                    <span>{column.header}</span>
                    {column.sortable && getSortIcon(String(column.key))}
                  </div>
                </th>
              ))}
              {actions && (
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700/50">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-6 py-16 text-center"
                >
                  <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-full mb-4">
                      <InboxIcon className="h-8 w-8" />
                    </div>
                    <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">No items found</p>
                    <p className="text-sm">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => (
                <tr
                  key={index}
                  className={`group transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700/30 ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={`px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200 ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''}`}
                    >
                      {column.render ?
                        column.render(item) :
                        String(item[column.key] || '-')
                      }
                    </td>
                  ))}
                  {actions && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {actions(item)}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/30 flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> of <span className="font-medium">{filteredData.length}</span> results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn btn-secondary btn-sm disabled:opacity-50"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="btn btn-secondary btn-sm disabled:opacity-50"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

export default DataTable;
