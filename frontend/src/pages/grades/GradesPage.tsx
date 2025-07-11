import React, { useState } from 'react';
import {
  AcademicCapIcon,
  ChartBarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { Exam } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../../components/Layout/PageHeader';
import ExamList from '../../components/grades/ExamList';
import BulkGradeEntry from '../../components/grades/BulkGradeEntry';
import GradeList from '../../components/grades/GradeList';
import GradeStatistics from '../../components/grades/GradeStatistics';
import StudentGradeSummary from '../../components/grades/StudentGradeSummary';
import ReportCard from '../../components/grades/ReportCard';
import Modal from '../../components/ui/Modal';

type TabType = 'exams' | 'grades' | 'statistics' | 'students' | 'reports';

const GradesPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('exams');
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [showBulkGradeEntry, setShowBulkGradeEntry] = useState(false);
  const [showReportCardModal, setShowReportCardModal] = useState(false);

  const canManageGrades = user?.role === 'admin' || user?.role === 'teacher';

  const tabs = [
    {
      id: 'exams' as TabType,
      name: 'Exams',
      icon: AcademicCapIcon,
      description: 'Manage exams and assessments'
    },
    {
      id: 'grades' as TabType,
      name: 'Grades',
      icon: ClipboardDocumentListIcon,
      description: 'View and manage student grades'
    },
    {
      id: 'statistics' as TabType,
      name: 'Statistics',
      icon: ChartBarIcon,
      description: 'Grade analytics and performance metrics'
    },
    {
      id: 'students' as TabType,
      name: 'Student Summary',
      icon: UserGroupIcon,
      description: 'Individual student grade summaries'
    },
    {
      id: 'reports' as TabType,
      name: 'Report Cards',
      icon: DocumentTextIcon,
      description: 'Generate and manage report cards'
    }
  ];

  const handleExamSelect = (exam: Exam) => {
    setSelectedExam(exam);
    setActiveTab('grades');
  };

  const handleBulkGradeEntry = () => {
    if (selectedExam) {
      setShowBulkGradeEntry(true);
    }
  };

  const handleGradesSubmitted = () => {
    setShowBulkGradeEntry(false);
    // Refresh the grade list if needed
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'exams':
        return <ExamList onExamSelect={handleExamSelect} />;

      case 'grades':
        if (selectedExam) {
          return (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Grades for {selectedExam.name}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedExam.subject_name} • {selectedExam.class_name}
                  </p>
                </div>
                {canManageGrades && (
                  <button
                    onClick={handleBulkGradeEntry}
                    className="btn btn-primary"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Bulk Grade Entry
                  </button>
                )}
              </div>
              <GradeList exam={selectedExam} />
            </div>
          );
        }
        return (
          <div className="card p-8 text-center">
            <ClipboardDocumentListIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Select an Exam
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Please select an exam from the Exams tab to view and manage grades.
            </p>
            <button
              onClick={() => setActiveTab('exams')}
              className="btn btn-primary"
            >
              Go to Exams
            </button>
          </div>
        );

      case 'statistics':
        return <GradeStatistics />;

      case 'students':
        return <StudentGradeSummary />;

      case 'reports':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Report Cards
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Generate and manage student report cards
                </p>
              </div>
              {canManageGrades && (
                <button
                  onClick={() => setShowReportCardModal(true)}
                  className="btn btn-primary"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create Report Card
                </button>
              )}
            </div>

            <div className="card p-8 text-center">
              <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Report Card Management
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Report card listing and management interface will be implemented here.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grade Management"
        description="Comprehensive grade and assessment management system"
      />

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon
                  className={`mr-2 h-5 w-5 ${
                    activeTab === tab.id
                      ? 'text-primary-500 dark:text-primary-400'
                      : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                  }`}
                />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {renderTabContent()}
      </div>

      {/* Bulk Grade Entry Modal */}
      <Modal
        isOpen={showBulkGradeEntry}
        onClose={() => setShowBulkGradeEntry(false)}
        title="Bulk Grade Entry"
        size="xl"
      >
        {selectedExam && (
          <BulkGradeEntry
            exam={selectedExam}
            onGradesSubmitted={handleGradesSubmitted}
            onCancel={() => setShowBulkGradeEntry(false)}
          />
        )}
      </Modal>

      {/* Create Report Card Modal */}
      <Modal
        isOpen={showReportCardModal}
        onClose={() => setShowReportCardModal(false)}
        title="Create Report Card"
        size="xl"
      >
        <ReportCard
          mode="create"
          onSubmit={() => setShowReportCardModal(false)}
          onCancel={() => setShowReportCardModal(false)}
        />
      </Modal>
    </div>
  );
};

export default GradesPage;
