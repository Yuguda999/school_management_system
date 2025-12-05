import React, { useState, useEffect } from 'react';
import {
  UserGroupIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  PlusIcon,
  BookOpenIcon,
  ClockIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Class, Student, Subject, TimetableEntry } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrentTerm } from '../../hooks/useCurrentTerm';
import { getClassLevelDisplay } from '../../utils/classUtils';
import { studentService } from '../../services/studentService';
import { getSchoolCodeFromUrl } from '../../utils/schoolCode';
import { academicService } from '../../services/academicService';
import DetailedStudentProfile from '../students/DetailedStudentProfile';
import { TemplateService, ReportCardTemplate } from '../../services/templateService';
import { useToast } from '../../hooks/useToast';
import { ReportCardRenderer } from '../templates/ReportCardRenderer';
import { ReportCardViewer } from '../reports/ReportCardViewer';
import Modal from '../ui/Modal';
import schoolService from '../../services/schoolService';
import gradeTemplateService from '../../services/gradeTemplateService';

interface ClassDetailsProps {
  classData: Class;
  onEdit?: () => void;
  onClose?: () => void;
  onUpdate?: (updatedClass: Class) => void;
}

const ClassDetails: React.FC<ClassDetailsProps> = ({
  classData,
  onClose,
  onUpdate
}) => {
  const { user } = useAuth();
  const { currentTerm } = useCurrentTerm();
  const [activeTab, setActiveTab] = useState('overview');
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showStudentProfile, setShowStudentProfile] = useState(false);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const { showSuccess, showError } = useToast();

  // Settings State
  const [templates, setTemplates] = useState<ReportCardTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(classData.report_card_template_id || '');
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const [savingTemplate, setSavingTemplate] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<ReportCardTemplate | null>(null);
  const [reportCardStudent, setReportCardStudent] = useState<Student | null>(null);

  // Bulk Download State
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0, currentStudent: '' });
  const bulkReportRef = React.useRef<HTMLDivElement>(null);

  // Check if user can edit classes (only admins and super admins, not teachers)
  const canEditClass = user && ['super_admin', 'admin', 'school_owner'].includes(user.role);

  // Check if user is class teacher (can view detailed student info)
  const isClassTeacher = user && user.role === 'teacher' && classData.teacher_id === user.id;

  const handleViewStudent = (student: Student) => {
    if (isClassTeacher || canEditClass) {
      setSelectedStudent(student);
      setShowStudentProfile(true);
    }
  };

  // Sync selectedTemplateId with classData prop changes
  useEffect(() => {
    setSelectedTemplateId(classData.report_card_template_id || '');
  }, [classData.report_card_template_id]);

  useEffect(() => {
    // Skip API calls for students
    if (user?.role === 'student') {
      return;
    }
    if (activeTab === 'students') {
      fetchStudents();
    } else if (activeTab === 'subjects') {
      fetchSubjects();
    } else if (activeTab === 'schedule') {
      fetchTimetable();
    } else if (activeTab === 'settings') {
      fetchTemplates();
    }
  }, [activeTab, classData.id, user?.role]);

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const data = await TemplateService.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      showError('Failed to load templates');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleSaveClassTemplate = async (templateId: string) => {
    setSavingTemplate(true);
    try {
      const updatedClass = await academicService.updateClass(classData.id, {
        report_card_template_id: templateId
      });
      setSelectedTemplateId(templateId);
      showSuccess('Class report card template updated');
      // Notify parent component to refresh class data
      if (onUpdate) {
        onUpdate(updatedClass);
      }
    } catch (error) {
      console.error('Failed to save class template:', error);
      showError('Failed to update class template');
    } finally {
      setSavingTemplate(false);
    }
  };



  const fetchStudents = async () => {
    try {
      setLoading(true);

      // Fetch real students data for this class
      const response = await studentService.getStudents({
        class_id: classData.id,
        status: 'active',
        page: 1,
        size: 100
      });

      setStudents(response.items || []);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      setLoading(true);

      // Fetch real subjects assigned to this class
      const classSubjects = await academicService.getClassSubjects(classData.id);

      // Extract subject information from class subjects
      const subjectsList: Subject[] = classSubjects.map(cs => ({
        id: cs.subject_id,
        name: cs.subject_name || 'Unknown Subject',
        code: cs.subject_code || '',
        credit_units: 0, // Credits not available in ClassSubjectAssignmentResponse
        school_id: classData.school_id,
        teachers: [], // Teachers not available in ClassSubjectAssignmentResponse
        description: '',
        is_core: cs.is_core || false,
        is_active: true,
        created_at: cs.created_at || '',
        updated_at: cs.updated_at || ''
      }));

      setSubjects(subjectsList);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      if (!currentTerm) {
        console.warn('No current term found');
        setTimetable([]);
        return;
      }

      const timetableEntries = await academicService.getClassTimetable(classData.id, currentTerm.id);
      setTimetable(timetableEntries);
    } catch (error) {
      console.error('Failed to fetch timetable:', error);
      setTimetable([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDownload = async () => {
    if (!students.length) return;

    setDownloading(true);
    setDownloadProgress({ current: 0, total: students.length, currentStudent: 'Preparing data...' });

    try {
      // 1. Get Template & School Info & Grade Template
      let templateData = null;
      let schoolInfo = null;
      let gradeTemplate = null;

      try {
        const [school, gradeTemplates] = await Promise.all([
          schoolService.getCurrentSchool(),
          gradeTemplateService.getGradeTemplates()
        ]);
        schoolInfo = school;
        // Try to find a grade template for this class or use default
        // For now using default as fallback
        gradeTemplate = gradeTemplates.find(t => t.is_default) || gradeTemplates[0];
      } catch (e) {
        console.error('Error fetching initial data', e);
      }

      if (selectedTemplateId) {
        try {
          templateData = await TemplateService.getTemplate(selectedTemplateId);
        } catch (e) {
          console.error('Failed to fetch selected template', e);
        }
      }

      if (!templateData) {
        const templates = await TemplateService.getTemplates();
        templateData = templates.find(t => t.isDefault) || templates[0];
      }

      if (!templateData) {
        showError('No report card template found');
        setDownloading(false);
        return;
      }

      // 2. Sort Students by Admission Number
      const sortedStudents = [...students].sort((a, b) =>
        a.admission_number.localeCompare(b.admission_number, undefined, { numeric: true })
      );

      // 3. Prepare Data for All Students
      const bulkData = [];
      for (let i = 0; i < sortedStudents.length; i++) {
        const student = sortedStudents[i];
        setDownloadProgress({
          current: i + 1,
          total: sortedStudents.length,
          currentStudent: `Fetching data for ${student.first_name}...`
        });

        let grades: any[] = [];
        let attendance: any = null;
        let summary: any = null;
        let studentFullData = student;

        try {
          studentFullData = await studentService.getStudentById(student.id);

          if (currentTerm) {
            summary = await import('../../services/gradeService').then(m => m.default.getStudentGradesSummary(student.id, currentTerm.id));
            grades = summary.grades.map((g: any) => ({
              subject: g.subject_name || 'Unknown Subject',
              score: g.score,
              total: g.score, // Assuming score is total
              grade: g.grade || '-',
              remark: g.remarks || '',
              components: g.component_scores
            }));
          }

          const schoolCode = getSchoolCodeFromUrl();
          if (currentTerm && schoolCode) {
            attendance = await import('../../services/attendanceService').then(m => m.attendanceService.getStudentAttendanceSummary(schoolCode, student.id, { term_id: currentTerm.id }));
          }
        } catch (e) {
          console.error(`Error fetching data for ${student.first_name}`, e);
        }

        // Prepare renderer data object
        const rendererData = {
          // School Info
          schoolName: schoolInfo?.name,
          schoolAddress: schoolInfo?.address,
          schoolMotto: schoolInfo?.motto,
          schoolLogo: schoolInfo?.logo_url,

          // Student Info
          studentName: `${studentFullData.first_name} ${studentFullData.last_name}`,
          className: classData.name,
          rollNumber: studentFullData.admission_number,
          academicYear: classData.academic_session,
          term: currentTerm?.name || 'Current Term',

          // Summary Stats
          totalScore: summary?.total_score?.toString() || '0',
          maxScore: summary?.total_possible?.toString() || '0',
          percentage: summary?.overall_percentage?.toFixed(1) || '0',
          position: summary?.position?.toString() || '-',
          result: summary?.overall_grade ? (summary.overall_grade === 'F' ? 'Fail' : 'Pass') : '-',

          // Attendance
          presentDays: attendance?.present_days?.toString() || '-',
          totalDays: attendance?.total_days?.toString() || '-',
          nextTermDate: 'TBD',
        };

        // Inject data into elements (for tables primarily)
        // We still use injectData for basic string replacement fallback, 
        // but we'll mostly rely on passing rendererData to the renderer.
        // However, for tables, we need to attach the data array to the element.
        const elementsWithTableData = (templateData.elements || []).map((el: any) => {
          if (el.type === 'grade_table') return { ...el, data: grades };
          if (el.type === 'attendance_table') return { ...el, data: attendance };
          return el;
        });

        bulkData.push({
          student,
          elements: elementsWithTableData,
          rendererData,
          gradeTemplate
        });
      }

      // 4. Render All Report Cards
      setPreviewTemplate({ ...templateData, bulkData } as any);

      // Wait for render
      await new Promise(resolve => setTimeout(resolve, 3000)); // Increased wait time for images

      // 5. Generate PDF
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      if (bulkReportRef.current) {
        const reportCards = bulkReportRef.current.children;

        for (let i = 0; i < reportCards.length; i++) {
          const reportCard = reportCards[i] as HTMLElement;
          const studentName = bulkData[i].student.first_name;

          setDownloadProgress({
            current: i + 1,
            total: bulkData.length,
            currentStudent: `Generating PDF for ${studentName}...`
          });

          const canvas = await html2canvas(reportCard, {
            scale: 2,
            useCORS: true,
            logging: false,
          });

          const imgData = canvas.toDataURL('image/png');
          const imgWidth = 210;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          if (i > 0) pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        }
      }

      // 6. Save
      pdf.save(`Class_Report_Cards_${classData.name}.pdf`);
      showSuccess('Report cards downloaded successfully');

    } catch (error) {
      console.error('Bulk download error:', error);
      showError('Failed to generate report cards');
    } finally {
      setDownloading(false);
      setPreviewTemplate(null);
    }
  };

  // Helper to inject data (duplicated from ReportCardViewer for now, ideally shared)
  const injectData = (elements: any[], studentData: any, grades: any[], attendance: any) => {
    if (!elements) return [];
    return elements.map(el => {
      let content = el.content;
      if (typeof content === 'string') {
        content = content
          .replace('[Student Name]', `${studentData?.first_name} ${studentData?.last_name}`)
          .replace('[Class Name]', classData.name || studentData?.current_class_name || 'N/A')
          .replace('[Roll Number]', studentData?.admission_number || 'N/A')
          .replace('[DOB]', studentData?.date_of_birth || 'N/A')
          .replace('[Parent Name]', studentData?.parent_name || 'N/A')
          .replace('[Attendance %]', attendance && typeof attendance.attendance_rate === 'number' ? `${attendance.attendance_rate.toFixed(1)}%` : 'N/A');
      }
      if (el.type === 'grade_table') return { ...el, data: grades };
      if (el.type === 'attendance_table') return { ...el, data: attendance };
      return { ...el, content };
    });
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BuildingOfficeIcon },
    { id: 'students', name: 'Students', icon: AcademicCapIcon },
    { id: 'subjects', name: 'Subjects', icon: BookOpenIcon },
    { id: 'schedule', name: 'Schedule', icon: ClockIcon },
    ...(canEditClass ? [{ id: 'settings', name: 'Settings', icon: Cog6ToothIcon }] : []),
  ];

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <BuildingOfficeIcon className="h-6 w-6 mr-2 text-primary-600" />
              {classData.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {getClassLevelDisplay(classData.level)}{classData.section ? ` - Section ${classData.section}` : ''} • {classData.academic_session}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
          >
            <span className="sr-only">Close</span>
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                >
                  <tab.icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Class Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Class Name:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {classData.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Class Level:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {getClassLevelDisplay(classData.level)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Section:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {classData.section || 'Not specified'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Academic Session:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {classData.academic_session}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Capacity:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {classData.capacity}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Current Students:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {classData.student_count || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
                    <span className={`text-sm font-medium ${classData.is_active ? 'text-green-600' : 'text-red-600'}`}>
                      {classData.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {classData.description && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Description:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {classData.description}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Class Teacher
                </h3>
                {classData.teacher_name ? (
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                      <UserGroupIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {classData.teacher_name}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No teacher assigned
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'students' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Students ({classData.student_count || 0}/{classData.capacity})
                </h3>
                <div className="flex space-x-2">
                  {canEditClass && (
                    <>
                      <button
                        onClick={handleBulkDownload}
                        disabled={downloading || students.length === 0}
                        className="btn btn-secondary btn-sm flex items-center"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                        {downloading ? 'Generating...' : 'Download All Report Cards'}
                      </button>
                      <button className="btn btn-primary btn-sm">
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Student
                      </button>
                    </>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : students.length > 0 ? (
                <div className="space-y-4">
                  {/* Desktop Table View */}
                  <div className="hidden md:block card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="table">
                        <thead className="table-header">
                          <tr>
                            <th className="table-header-cell">Student</th>
                            <th className="table-header-cell">Student ID</th>
                            <th className="table-header-cell">Email</th>
                            <th className="table-header-cell">Status</th>
                            <th className="table-header-cell">Admission Date</th>
                            <th className="table-header-cell">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="table-body">
                          {students.map((student) => (
                            <tr
                              key={student.id}
                              className={`${(isClassTeacher || canEditClass) ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors' : ''}`}
                              onClick={() => handleViewStudent(student)}
                            >
                              <td className="table-cell">
                                <div className="flex items-center">
                                  <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mr-3 text-primary-600 dark:text-primary-400 font-medium text-sm">
                                    {student.first_name[0]}{student.last_name[0]}
                                  </div>
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {student.first_name} {student.last_name}
                                  </span>
                                </div>
                              </td>
                              <td className="table-cell font-mono text-xs text-gray-500">{student.admission_number}</td>
                              <td className="table-cell text-gray-500">{student.email}</td>
                              <td className="table-cell">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${student.status === 'active'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                  }`}>
                                  {student.status}
                                </span>
                              </td>
                              <td className="table-cell text-gray-500">
                                {new Date(student.admission_date).toLocaleDateString()}
                              </td>
                              <td className="table-cell">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setReportCardStudent(student);
                                  }}
                                  className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                                  title="View Report Card"
                                >
                                  <DocumentTextIcon className="h-5 w-5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {students.map((student) => (
                      <div
                        key={student.id}
                        className="card p-4 space-y-3 active:scale-[0.99] transition-transform"
                        onClick={() => handleViewStudent(student)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold">
                              {student.first_name[0]}{student.last_name[0]}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {student.first_name} {student.last_name}
                              </h4>
                              <p className="text-xs text-gray-500 font-mono">
                                {student.admission_number}
                              </p>
                            </div>
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${student.status === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                            {student.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700">
                          <div>
                            <span className="block text-xs text-gray-400">Email</span>
                            <span className="truncate block">{student.email}</span>
                          </div>
                          <div>
                            <span className="block text-xs text-gray-400">Joined</span>
                            {new Date(student.admission_date).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setReportCardStudent(student);
                            }}
                            className="flex items-center space-x-2 text-sm text-primary-600 dark:text-primary-400 font-medium px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
                          >
                            <DocumentTextIcon className="h-4 w-4" />
                            <span>Report Card</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="card p-6">
                  <div className="text-center py-8">
                    <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No students found in this class</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                      Students will appear here once they are assigned to this class
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'subjects' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Subjects ({subjects.length})
                </h3>
                {canEditClass && (
                  <button className="btn btn-primary btn-sm">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Assign Subject
                  </button>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : subjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subjects.map((subject) => (
                    <div key={subject.id} className="card p-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-lg bg-secondary-100 dark:bg-secondary-900 flex items-center justify-center">
                          <BookOpenIcon className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {subject.name}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {subject.code} • {subject.credit_units} credits
                          </p>
                          {subject.teachers && subject.teachers.length > 0 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Teacher{subject.teachers.length > 1 ? 's' : ''}: {subject.teachers.map(t => t.teacher_name).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card p-6">
                  <div className="text-center py-8">
                    <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No subjects assigned to this class</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                      Subjects will appear here once they are assigned to this class
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Class Timetable {currentTerm && `- ${currentTerm.name}`}
                </h3>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : timetable.length > 0 ? (
                <div className="card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead className="table-header">
                        <tr>
                          <th className="table-header-cell">Day</th>
                          <th className="table-header-cell">Time</th>
                          <th className="table-header-cell">Subject</th>
                          <th className="table-header-cell">Teacher</th>
                          <th className="table-header-cell">Room</th>
                        </tr>
                      </thead>
                      <tbody className="table-body">
                        {timetable
                          .sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time))
                          .map((entry) => (
                            <tr key={entry.id}>
                              <td className="table-cell">
                                <span className="font-medium">
                                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][entry.day_of_week]}
                                </span>
                              </td>
                              <td className="table-cell">
                                <span className="text-sm">
                                  {entry.start_time} - {entry.end_time}
                                </span>
                              </td>
                              <td className="table-cell">
                                <div className="flex items-center">
                                  <div className="h-8 w-8 rounded-lg bg-secondary-100 dark:bg-secondary-900 flex items-center justify-center mr-3">
                                    <BookOpenIcon className="h-4 w-4 text-secondary-600 dark:text-secondary-400" />
                                  </div>
                                  <span className="font-medium">{entry.subject_name}</span>
                                </div>
                              </td>
                              <td className="table-cell">
                                <span className="text-sm">{entry.teacher_name || 'Not assigned'}</span>
                              </td>
                              <td className="table-cell">
                                <span className="text-sm">{entry.room || 'TBA'}</span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="card p-6">
                  <div className="text-center py-8">
                    <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      {currentTerm ? 'No timetable entries found for this class' : 'No active term found'}
                    </p>
                    {!currentTerm && (
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                        Please ensure there is an active academic term to view the timetable
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && canEditClass && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Class Settings
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Configure settings specific to this class.
                </p>
              </div>

              <div className="card p-6">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Report Card Template
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Select a specific report card template for this class. If not selected, the school default template will be used.
                </p>

                {loadingTemplates ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {/* Option to use School Default */}
                    <div
                      className={`relative border rounded-lg p-2 cursor-pointer transition-all group ${!selectedTemplateId
                        ? 'border-primary-500 ring-2 ring-primary-500 ring-opacity-50 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                        }`}
                      onClick={() => setSelectedTemplateId('')}
                    >
                      <div className="aspect-[210/297] bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded mb-1.5 flex items-center justify-center">
                        <BuildingOfficeIcon className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="flex justify-between items-start">
                        <div className="min-w-0 flex-1">
                          <h5 className="font-medium text-gray-900 dark:text-gray-100 text-xs truncate" title="Use School Default">Use School Default</h5>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">System configured</p>
                        </div>
                        {!selectedTemplateId && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                            Selected
                          </span>
                        )}
                      </div>
                    </div>

                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className={`relative border rounded-lg p-2 cursor-pointer transition-all group ${selectedTemplateId === template.id
                          ? 'border-primary-500 ring-2 ring-primary-500 ring-opacity-50 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                          }`}
                        onClick={() => setSelectedTemplateId(template.id)}
                      >
                        <div className="aspect-[210/297] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded mb-1.5 overflow-hidden relative">
                          {/* Scaled Preview */}
                          <div className="w-full h-full overflow-hidden relative">
                            <div className="transform scale-[0.2] origin-top-left w-[500%] h-[500%] pointer-events-none select-none relative bg-white">
                              {template.elements?.map((element: any) => (
                                <ReportCardRenderer
                                  key={element.id}
                                  element={element}
                                  isPreview={true}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Overlay with Preview Button */}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewTemplate(template);
                              }}
                              className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:scale-110 transition-transform"
                              title="Preview Template"
                            >
                              <EyeIcon className="h-4 w-4 text-gray-700 dark:text-gray-200" />
                            </button>
                          </div>
                        </div>

                        <div className="flex justify-between items-start">
                          <div className="min-w-0 flex-1">
                            <h5 className="font-medium text-gray-900 dark:text-gray-100 text-xs truncate" title={template.name}>{template.name}</h5>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 truncate" title={template.description}>{template.description}</p>
                          </div>
                          {selectedTemplateId === template.id && (
                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                              Selected
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => handleSaveClassTemplate(selectedTemplateId)}
                    disabled={savingTemplate}
                    className="btn btn-primary"
                  >
                    {savingTemplate ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Hidden Container for Bulk Report Generation */}
        {previewTemplate && downloading && (
          <div className="absolute top-0 left-0 -z-50 opacity-0 pointer-events-none">
            <div ref={bulkReportRef} style={{ width: '794px', height: '1123px', position: 'relative' }}>
              {(previewTemplate as any).bulkData?.map((data: any, index: number) => (
                <div
                  key={index}
                  className="bg-white absolute top-0 left-0"
                  style={{
                    width: previewTemplate.paper_size === 'A4' ? '794px' : '816px',
                    height: previewTemplate.paper_size === 'A4' ? '1123px' : '1056px',
                    backgroundColor: previewTemplate.background_color || '#ffffff'
                  }}
                >
                  {data.elements?.map((element: any) => (
                    <ReportCardRenderer
                      key={element.id}
                      element={element}
                      scale={1}
                      isPreview={true}
                      data={data.rendererData}
                      gradeTemplate={data.gradeTemplate}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bulk Download Progress Modal */}
        {downloading && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full shadow-xl">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Generating Report Cards
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>Processing...</span>
                  <span>{downloadProgress.current} / {downloadProgress.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div
                    className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${(downloadProgress.current / downloadProgress.total) * 100}%` }}
                  ></div>
                </div>
                <p className="text-sm text-center text-gray-500 dark:text-gray-400 truncate">
                  {downloadProgress.currentStudent}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Template Preview Modal */}
        {previewTemplate && !downloading && (
          <Modal
            isOpen={!!previewTemplate}
            onClose={() => setPreviewTemplate(null)}
            title={`Preview: ${previewTemplate.name}`}
            size="2xl"
          >
            <div className="flex justify-center bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-auto max-h-[80vh]">
              <div className="bg-white shadow-lg relative" style={{ width: '794px', height: '1123px' }}>
                {previewTemplate.elements?.map((element: any) => (
                  <ReportCardRenderer
                    key={element.id}
                    element={element}
                    isPreview={true}
                  />
                ))}
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="btn btn-outline"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedTemplateId(previewTemplate.id);
                  setPreviewTemplate(null);
                }}
                className="btn btn-primary"
              >
                Select This Template
              </button>
            </div>
          </Modal>
        )}

        {/* Student Profile Modal */}
        {showStudentProfile && selectedStudent && (
          <DetailedStudentProfile
            student={selectedStudent}
            onClose={() => {
              setShowStudentProfile(false);
              setSelectedStudent(null);
            }}
          />
        )}

        {/* Report Card Viewer Modal */}
        {reportCardStudent && (
          <ReportCardViewer
            isOpen={!!reportCardStudent}
            onClose={() => setReportCardStudent(null)}
            studentId={reportCardStudent.id}
            termId={currentTerm?.id}
            classId={classData.id}
            className={classData.name}
          />
        )}
      </div>
    </div>
  );
};

export default ClassDetails;
