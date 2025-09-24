import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MagnifyingGlassIcon,
  EyeIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { usePermissions } from '../../hooks/usePermissions';

interface School {
  id: string;
  name: string;
  code: string;
  email: string;
  phone?: string;
  address: string;
  owner_name: string;
  owner_email: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  student_count: number;
  teacher_count: number;
  last_activity?: string;
}

const PlatformSchoolsPage: React.FC = () => {
  const { canManagePlatform } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Mock data - replace with actual API call
  const schools: School[] = [
    {
      id: '1',
      name: 'Greenwood High School',
      code: 'GHS001',
      email: 'admin@greenwood.edu',
      phone: '+234-123-456-789',
      address: '123 Education Street, Lagos',
      owner_name: 'John Smith',
      owner_email: 'john.smith@example.com',
      is_active: true,
      is_verified: true,
      created_at: '2024-01-15T10:30:00Z',
      student_count: 450,
      teacher_count: 25,
      last_activity: '2024-03-15T14:20:00Z',
    },
    {
      id: '2',
      name: 'St. Mary\'s Academy',
      code: 'SMA002',
      email: 'info@stmarys.edu',
      phone: '+234-987-654-321',
      address: '456 Learning Avenue, Abuja',
      owner_name: 'Mary Johnson',
      owner_email: 'mary.johnson@example.com',
      is_active: true,
      is_verified: true,
      created_at: '2024-02-20T09:15:00Z',
      student_count: 320,
      teacher_count: 18,
      last_activity: '2024-03-14T16:45:00Z',
    },
    {
      id: '3',
      name: 'Future Leaders College',
      code: 'FLC003',
      email: 'contact@futureleaders.edu',
      phone: '+234-555-123-456',
      address: '789 Innovation Road, Port Harcourt',
      owner_name: 'David Brown',
      owner_email: 'david.brown@example.com',
      is_active: false,
      is_verified: false,
      created_at: '2024-03-01T11:00:00Z',
      student_count: 0,
      teacher_count: 0,
      last_activity: undefined,
    },
  ];

  const filteredSchools = schools.filter(school => {
    const matchesSearch = 
      school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.owner_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === '' ||
      (statusFilter === 'active' && school.is_active) ||
      (statusFilter === 'inactive' && !school.is_active) ||
      (statusFilter === 'verified' && school.is_verified) ||
      (statusFilter === 'unverified' && !school.is_verified);
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!canManagePlatform()) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          You don't have permission to access this page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Platform Schools
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Monitor and manage all schools registered on the platform.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Schools</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{schools.length}</p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Students</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {schools.reduce((sum, school) => sum + school.student_count, 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AcademicCapIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Teachers</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {schools.reduce((sum, school) => sum + school.teacher_count, 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Schools</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {schools.filter(school => school.is_active).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search schools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>
        </div>
      </div>

      {/* Schools Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  School
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Students/Teachers
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Last Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredSchools.map((school) => (
                <tr key={school.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                        <BuildingOfficeIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {school.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {school.code} • {school.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {school.owner_name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {school.owner_email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {school.student_count} students
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {school.teacher_count} teachers
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        school.is_active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {school.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        school.is_verified
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {school.is_verified ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {school.last_activity ? formatDate(school.last_activity) : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      to={`/platform/schools/${school.id}`}
                      className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredSchools.length === 0 && (
        <div className="text-center py-12">
          <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No schools found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm ? 'Try adjusting your search criteria.' : 'No schools have been registered yet.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default PlatformSchoolsPage;
