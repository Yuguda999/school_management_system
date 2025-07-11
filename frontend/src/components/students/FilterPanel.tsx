import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface FilterPanelProps {
  filters: {
    class_id: string;
    status: string;
    page: number;
    size: number;
  };
  onFilterChange: (filters: any) => void;
  onClose: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onFilterChange, onClose }) => {
  const handleFilterChange = (key: string, value: string) => {
    onFilterChange({ [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({
      class_id: '',
      status: '',
      page: 1,
      size: 10,
    });
  };

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Filters</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Class
          </label>
          <select
            value={filters.class_id}
            onChange={(e) => handleFilterChange('class_id', e.target.value)}
            className="input"
          >
            <option value="">All Classes</option>
            <option value="class1">Grade 9-A</option>
            <option value="class2">Grade 9-B</option>
            <option value="class3">Grade 10-A</option>
            <option value="class4">Grade 10-B</option>
            {/* Add more class options */}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="input"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="graduated">Graduated</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Items per page
          </label>
          <select
            value={filters.size}
            onChange={(e) => handleFilterChange('size', e.target.value)}
            className="input"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <button
          type="button"
          onClick={clearFilters}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-500"
        >
          Clear all filters
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;
