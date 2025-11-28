import React from 'react';
import { PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { Student } from '../../types';
import { usePermissions } from '../../hooks/usePermissions';
import DataTable, { Column } from '../ui/DataTable';

interface StudentTableProps {
  students: Student[];
  selectedStudents: string[];
  onSelectionChange: (selected: string[]) => void;
  onView: (student: Student) => void;
  onEdit: (student: Student) => void;
  onDelete: (studentId: string) => void;
  pagination: {
    page: number;
    pages: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  userRole?: string;
  showActions?: boolean;
}

const StudentTable: React.FC<StudentTableProps> = ({
  students,
  selectedStudents,
  onSelectionChange,
  onView,
  onEdit,
  onDelete,
  pagination,
  showActions = true,
}) => {
  const { canManageStudents } = usePermissions();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(students.map(s => s.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOne = (studentId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedStudents, studentId]);
    } else {
      onSelectionChange(selectedStudents.filter(id => id !== studentId));
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      inactive: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      graduated: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    };

    return (
      <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const columns: Column<Student>[] = [
    ...(canManageStudents() ? [{
      key: 'selection',
      header: (
        <input
          type="checkbox"
          checked={selectedStudents.length === students.length && students.length > 0}
          onChange={(e) => handleSelectAll(e.target.checked)}
          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 transition-colors duration-200"
        />
      ),
      width: '48px',
      render: (student: Student) => (
        <input
          type="checkbox"
          checked={selectedStudents.includes(student.id)}
          onChange={(e) => handleSelectOne(student.id, e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 transition-colors duration-200"
        />
      )
    }] : []),
    {
      key: 'name',
      header: 'Student',
      render: (student) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900 dark:to-secondary-900 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold shadow-sm">
              {student.first_name?.[0]}{student.last_name?.[0]}
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {student.first_name} {student.last_name}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {student.email || 'No email'}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'admission_number',
      header: 'Admission No.',
      sortable: true
    },
    {
      key: 'current_class_name',
      header: 'Class',
      render: (student) => student.current_class_name || <span className="text-gray-400 italic">Not assigned</span>
    },
    {
      key: 'status',
      header: 'Status',
      render: (student) => getStatusBadge(student.status)
    },
    {
      key: 'admission_date',
      header: 'Admission Date',
      render: (student) => new Date(student.admission_date).toLocaleDateString()
    }
  ];

  const renderActions = (student: Student) => (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); onView(student); }}
        className="p-1 rounded-full text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
        title="View Details"
      >
        <EyeIcon className="h-5 w-5" />
      </button>
      {canManageStudents() && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(student); }}
            className="p-1 rounded-full text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
            title="Edit Student"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(student.id); }}
            className="p-1 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Delete Student"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </>
      )}
    </>
  );

  return (
    <DataTable
      data={students}
      columns={columns}
      actions={showActions ? renderActions : undefined}
      pagination={true}
      searchable={false}
      itemsPerPage={pagination.total > 0 ? students.length : 10} // Just to show pagination controls if needed, though DataTable handles internal pagination usually. 
    // Wait, DataTable has internal pagination state. 
    // But StudentTable props has `pagination` object which implies server-side pagination.
    // My DataTable implementation currently does CLIENT-SIDE pagination.
    // I need to update DataTable to support server-side pagination or disable its internal pagination if external control is provided.
    />
  );
};

export default StudentTable;
