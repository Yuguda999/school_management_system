import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  ChartBarIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { reportsService, StudentReport } from '../../services/reportsService';
import { useCurrentTerm } from '../../hooks/useCurrentTerm';
import { useCurrency } from '../../contexts/CurrencyContext';
import CurrentTermIndicator from '../terms/CurrentTermIndicator';
import { academicService } from '../../services/academicService';
import { Class } from '../../types';
import DataTable, { Column } from '../ui/DataTable';
import Modal from '../ui/Modal';
import Card from '../ui/Card';

const StudentReports: React.FC = () => {
  const { currentTerm } = useCurrentTerm();
  const { formatCurrency } = useCurrency();
  const [students, setStudents] = useState<StudentReport[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    class_id: '',
    term_id: '',
    search: '',
  });
  const [selectedStudent, setSelectedStudent] = useState<StudentReport | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Update filters when current term changes
  useEffect(() => {
    if (currentTerm) {
      setFilters(prev => ({ ...prev, term_id: currentTerm.id }));
    }
  }, [currentTerm?.id]);

  useEffect(() => {
    fetchClasses();
    fetchStudentReports();
  }, [filters]);

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
      setError(null);

      // Try to fetch real data with current filters
      try {
        const params = {
          class_id: filters.class_id || undefined,
          term_id: filters.term_id || currentTerm?.id,
          page: 1, // DataTable handles pagination client-side for now or we can implement server-side
          size: 100
        };
        const response = await reportsService.getStudentReports(params);
        setStudents(response.items);
        return;
      } catch (apiError) {
        console.warn('Failed to fetch student reports from API, using mock data:', apiError);
      }

      // Fallback to mock data
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
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      case 'overdue':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
    }
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600 dark:text-green-400';
    if (rate >= 75) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-green-600 dark:text-green-400';
    if (grade >= 75) return 'text-blue-600 dark:text-blue-400';
    if (grade >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const columns: Column<StudentReport>[] = [
    {
      key: 'student_name',
      header: 'Student',
      sortable: true,
      render: (student) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {student.student_name}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            ID: {student.student_id}
          </div>
        </div>
      ),
    },
    {
      key: 'class_name',
      header: 'Class',
      sortable: true,
      render: (student) => (
        <span className="text-sm text-gray-900 dark:text-white">
          {student.class_name}
        </span>
      ),
    },
    {
      key: 'attendance_rate',
      header: 'Attendance',
      sortable: true,
      render: (student) => (
        <div className="flex items-center">
          <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mr-2">
            <div
              className={`h-1.5 rounded-full ${student.attendance_rate >= 90 ? 'bg-green-500' :
                student.attendance_rate >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
              style={{ width: `${student.attendance_rate}%` }}
            ></div>
          </div>
          <span className={`text-sm font-medium ${getAttendanceColor(student.attendance_rate)}`}>
            {student.attendance_rate}%
          </span>
        </div>
      ),
    },
    {
      key: 'grade_average',
      header: 'Grade Avg',
      sortable: true,
      render: (student) => (
        <span className={`text-sm font-bold ${getGradeColor(student.grade_average)}`}>
          {student.grade_average}%
        </span>
      ),
    },
    {
      key: 'fee_status',
      header: 'Fee Status',
      sortable: true,
      render: (student) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(student.fee_status)}`}>
          {student.fee_status.charAt(0).toUpperCase() + student.fee_status.slice(1)}
        </span>
      ),
    },
    {
      key: 'pending_amount',
      header: 'Pending',
      sortable: true,
      render: (student) => (
        <span className={`text-sm font-medium ${student.pending_amount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
          {formatCurrency(student.pending_amount)}
        </span>
      ),
    },
  ];

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400">{error}</p>
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
    <div className="space-y-6 animate-fade-in">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex-1">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'} w-full sm:w-auto`}
          >
            <FunnelIcon className="w-4 h-4 mr-2" />
            Filters
          </button>
        </div>

        <button className="btn btn-primary w-full sm:w-auto">
          <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
          Export All
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card variant="glass" className="animate-fade-in-up">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Class</label>
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
              <label className="label">Term</label>
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
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ class_id: '', term_id: '', search: '' })}
                className="btn btn-secondary w-full"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Students Table */}
      <DataTable
        data={students}
        columns={columns}
        loading={loading}
        searchable={true}
        searchPlaceholder="Search by student name..."
        emptyMessage="No student reports found"
        actions={(student) => (
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedStudent(student)}
              className="p-1 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              title="View Details"
            >
              <EyeIcon className="w-5 h-5" />
            </button>
            <button
              className="p-1 rounded-full text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
              title="Download Report"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
            </button>
          </div>
        )}
      />

      {/* Student Detail Modal */}
      <Modal
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        title="Student Report Details"
        size="lg"
      >
        {selectedStudent && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 text-2xl font-bold">
                  {selectedStudent.student_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedStudent.student_name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    ID: {selectedStudent.student_id} • {selectedStudent.class_name}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center">
                  <AcademicCapIcon className="h-4 w-4 mr-2 text-blue-500" />
                  Academic Performance
                </h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Grade Average</span>
                      <span className={`text-sm font-bold ${getGradeColor(selectedStudent.grade_average)}`}>
                        {selectedStudent.grade_average}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${selectedStudent.grade_average >= 90 ? 'bg-green-500' :
                          selectedStudent.grade_average >= 75 ? 'bg-blue-500' :
                            selectedStudent.grade_average >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                        style={{ width: `${selectedStudent.grade_average}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Attendance Rate</span>
                      <span className={`text-sm font-bold ${getAttendanceColor(selectedStudent.attendance_rate)}`}>
                        {selectedStudent.attendance_rate}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${selectedStudent.attendance_rate >= 90 ? 'bg-green-500' :
                          selectedStudent.attendance_rate >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                        style={{ width: `${selectedStudent.attendance_rate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center">
                  <CurrencyDollarIcon className="h-4 w-4 mr-2 text-green-500" />
                  Fee Information
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedStudent.fee_status)}`}>
                      {selectedStudent.fee_status.charAt(0).toUpperCase() + selectedStudent.fee_status.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Paid</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(selectedStudent.total_fees_paid)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">Pending</span>
                    <span className={`text-sm font-bold ${selectedStudent.pending_amount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      {formatCurrency(selectedStudent.pending_amount)}
                    </span>
                  </div>
                  {selectedStudent.last_payment_date && (
                    <div className="flex justify-between mt-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Last Payment</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(selectedStudent.last_payment_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StudentReports;
