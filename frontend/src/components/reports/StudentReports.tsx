import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { reportsService, StudentReport } from '../../services/reportsService';
import { academicService } from '../../services/academicService';
import { Class } from '../../types';

const StudentReports: React.FC = () => {
  const [students, setStudents] = useState<StudentReport[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    class_id: '',
    term_id: '',
    search: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<StudentReport | null>(null);

  useEffect(() => {
    fetchClasses();
    fetchStudentReports();
  }, [currentPage, filters]);

  const fetchClasses = async () => {
    try {
      const response = await academicService.getClasses();
      setClasses(response.items);
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  const fetchStudentReports = async () => {
    try {
      setLoading(true);
      // Mock data since backend endpoint doesn't exist yet
      const mockStudents: StudentReport[] = [
        {
          student_id: '1',
          student_name: 'John Doe',
          class_name: 'Class 10-A',
          attendance_rate: 95.5,
          grade_average: 87.2,
          fee_status: 'paid',
          last_payment_date: '2024-01-15',
          total_fees_paid: 25000,
          pending_amount: 0,
        },
        {
          student_id: '2',
          student_name: 'Jane Smith',
          class_name: 'Class 10-A',
          attendance_rate: 88.3,
          grade_average: 92.1,
          fee_status: 'pending',
          last_payment_date: '2023-12-10',
          total_fees_paid: 20000,
          pending_amount: 5000,
        },
        {
          student_id: '3',
          student_name: 'Mike Johnson',
          class_name: 'Class 9-B',
          attendance_rate: 76.8,
          grade_average: 78.5,
          fee_status: 'overdue',
          last_payment_date: '2023-11-05',
          total_fees_paid: 15000,
          pending_amount: 10000,
        },
      ];
      
      setStudents(mockStudents);
      setTotalPages(1);
    } catch (err) {
      setError('Failed to fetch student reports');
      console.error('Error fetching student reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
      case 'overdue':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
    }
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-green-600';
    if (grade >= 75) return 'text-blue-600';
    if (grade >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchStudentReports}
          className="mt-2 btn btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search Students
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="input pl-10"
                placeholder="Search by name..."
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Class
            </label>
            <select
              value={filters.class_id}
              onChange={(e) => setFilters({ ...filters, class_id: e.target.value })}
              className="input"
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} - {cls.section}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Term
            </label>
            <select
              value={filters.term_id}
              onChange={(e) => setFilters({ ...filters, term_id: e.target.value })}
              className="input"
            >
              <option value="">Current Term</option>
              <option value="term1">Term 1</option>
              <option value="term2">Term 2</option>
              <option value="term3">Term 3</option>
            </select>
          </div>
          <div className="flex items-end space-x-2">
            <button
              onClick={() => {
                setFilters({ class_id: '', term_id: '', search: '' });
                setCurrentPage(1);
              }}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <FunnelIcon className="h-4 w-4" />
              <span>Clear</span>
            </button>
            <button className="btn btn-primary flex items-center space-x-2">
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Student Reports</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Attendance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Grade Average
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fee Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Pending Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {students.map((student) => (
                <tr key={student.student_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {student.student_name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        ID: {student.student_id}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {student.class_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${getAttendanceColor(student.attendance_rate)}`}>
                      {student.attendance_rate}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${getGradeColor(student.grade_average)}`}>
                      {student.grade_average}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(student.fee_status)}`}>
                      {student.fee_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    ₹{student.pending_amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        className="text-green-600 hover:text-green-800 dark:text-green-400"
                        title="View Report"
                      >
                        <ChartBarIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="btn btn-secondary disabled:opacity-50"
          >
            Previous
          </button>
          <span className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="btn btn-secondary disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {selectedStudent.student_name} - Detailed Report
                </h3>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Academic Performance</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Grade Average: <span className="font-medium">{selectedStudent.grade_average}%</span>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Class: <span className="font-medium">{selectedStudent.class_name}</span>
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Attendance</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Attendance Rate: <span className="font-medium">{selectedStudent.attendance_rate}%</span>
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Fee Information</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Status: <span className={`font-medium ${getStatusColor(selectedStudent.fee_status)}`}>
                        {selectedStudent.fee_status}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Total Paid: <span className="font-medium">₹{selectedStudent.total_fees_paid.toLocaleString()}</span>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Pending: <span className="font-medium">₹{selectedStudent.pending_amount.toLocaleString()}</span>
                    </p>
                    {selectedStudent.last_payment_date && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Last Payment: <span className="font-medium">
                          {new Date(selectedStudent.last_payment_date).toLocaleDateString()}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="btn btn-secondary"
                >
                  Close
                </button>
                <button className="btn btn-primary">
                  Export Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentReports;
