import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { academicService } from '../../services/academicService';
import { Class } from '../../types';

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
  const [classes, setClasses] = useState<Class[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoadingClasses(true);
      const response = await academicService.getClasses({ is_active: true, size: 100 });
      setClasses(response);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    } finally {
      setLoadingClasses(false);
    }
  };

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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Class
        </label>
        <select
          value={filters.class_id}
          onChange={(e) => handleFilterChange('class_id', e.target.value)}
          className="input"
          disabled={loadingClasses}
        >
          <option value="">All Classes</option>
          {loadingClasses ? (
            <option disabled>Loading classes...</option>
          ) : classes.length === 0 ? (
            <option disabled>No classes available</option>
          ) : (
            classes.map((classItem) => (
              <option key={classItem.id} value={classItem.id}>
                {classItem.name}
              </option>
            ))
          )}
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

      <div className="sm:col-span-3 flex justify-end">
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
