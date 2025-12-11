import React, { useState } from 'react';
import {
  AcademicCapIcon,
  ChartBarIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  PlusIcon,
  AdjustmentsHorizontalIcon,
  TableCellsIcon,
  SwatchIcon,
  DocumentChartBarIcon
} from '@heroicons/react/24/outline';
import { Exam, Term } from '../../types';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrentTerm } from '../../hooks/useCurrentTerm';
import PageHeader from '../../components/Layout/PageHeader';
import ExamList from '../../components/grades/ExamList';
import BulkGradeEntry from '../../components/grades/BulkGradeEntry';
import GradeList from '../../components/grades/GradeList';
import GradeStatistics from '../../components/grades/GradeStatistics';
import StudentGradeSummary from '../../components/grades/StudentGradeSummary';
import ComponentMapping from '../../components/grades/ComponentMapping';
import GradebookPanel from '../../components/grades/GradebookPanel';
import ReportCardTemplatesPanel from '../../components/grades/ReportCardTemplatesPanel';
import ClassGradeSummarySheet from '../../components/grades/ClassGradeSummarySheet';
import DataTermFilter from '../../components/terms/DataTermFilter';
import Modal from '../../components/ui/Modal';
import Card from '../../components/ui/Card';

type TabType = 'exams' | 'grades' | 'mapping' | 'statistics' | 'students' | 'gradebook' | 'templates' | 'summary';

const GradesPage: React.FC = () => {
  const { canManageGrades } = usePermissions();
  const { user } = useAuth();
  const { rawCurrentTerm } = useCurrentTerm();
  const [activeTab, setActiveTab] = useState<TabType>('exams');
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [showBulkGradeEntry, setShowBulkGradeEntry] = useState(false);
  const [gradeListKey, setGradeListKey] = useState(0);

  // Term filter state - defaults to current term
  const [selectedTermId, setSelectedTermId] = useState<string | null>(rawCurrentTerm?.id || null);
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(rawCurrentTerm || null);

  const handleTermChange = (termId: string | null, term: Term | null) => {
    setSelectedTermId(termId);
    setSelectedTerm(term);
    // Reset selected exam when term changes
    setSelectedExam(null);
  };

  const isSchoolOwner = user?.role === 'school_owner';

  const tabs = [
    {
      id: 'exams' as TabType,
      name: 'Exams',
      icon: AcademicCapIcon,
      description: 'Manage exams and assessments',
      show: true,
    },
    {
      id: 'grades' as TabType,
      name: 'Grades',
      icon: ClipboardDocumentListIcon,
      description: 'View and manage student grades',
      show: true,
    },
    {
      id: 'mapping' as TabType,
      name: 'Grade Setup',
      icon: AdjustmentsHorizontalIcon,
      description: 'Configure how your assessments count toward final grades',
      show: true,
    },
    {
      id: 'statistics' as TabType,
      name: 'Statistics',
      icon: ChartBarIcon,
      description: 'Grade analytics and performance metrics',
      show: true,
    },
    {
      id: 'students' as TabType,
      name: 'Student Summary',
      icon: UserGroupIcon,
      description: 'Individual student grade summaries',
      show: true,
    },
    {
      id: 'gradebook' as TabType,
      name: 'Gradebook',
      icon: TableCellsIcon,
      description: 'Unified gradebook with automated calculations',
      show: true,
    },
    {
      id: 'templates' as TabType,
      name: 'Report Cards',
      icon: SwatchIcon,
      description: 'Manage report card templates',
      show: isSchoolOwner,
    },
    {
      id: 'summary' as TabType,
      name: 'Summary Sheet',
      icon: DocumentChartBarIcon,
      description: 'Class grades summary with totals and positions',
      show: isSchoolOwner,
    },
  ];

  const visibleTabs = tabs.filter(tab => tab.show);

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
    // Refresh the grade list by updating the key
    setGradeListKey(prev => prev + 1);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'exams':
        return <ExamList onExamSelect={handleExamSelect} />;

      case 'grades':
        if (selectedExam) {
          return (
            <div className="space-y-6 animate-fade-in">
              <Card variant="glass" className="border-l-4 border-l-primary-500">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Grades for {selectedExam.name}
                    </h2>
                    <div className="flex items-center mt-1 text-sm text-gray-600 dark:text-gray-400">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400 mr-2">
                        {selectedExam.subject_name}
                      </span>
                      <span>{selectedExam.class_name}</span>
                    </div>
                  </div>
                  {canManageGrades() && (
                    <button
                      onClick={handleBulkGradeEntry}
                      className="btn btn-primary"
                    >
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Bulk Grade Entry
                    </button>
                  )}
                </div>
              </Card>
              <GradeList key={gradeListKey} exam={selectedExam} />
            </div>
          );
        }
        return (
          <Card variant="glass" className="p-12 text-center animate-fade-in">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <ClipboardDocumentListIcon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Select an Exam
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Please select an exam from the Exams tab to view and manage grades for a specific class and subject.
            </p>
            <button
              onClick={() => setActiveTab('exams')}
              className="btn btn-primary"
            >
              Go to Exams
            </button>
          </Card>
        );

      case 'statistics':
        return <GradeStatistics />;

      case 'mapping':
        return <ComponentMapping />;

      case 'students':
        return <StudentGradeSummary />;

      case 'gradebook':
        return <GradebookPanel />;

      case 'templates':
        return isSchoolOwner ? <ReportCardTemplatesPanel /> : null;

      case 'summary':
        return isSchoolOwner ? <ClassGradeSummarySheet selectedTermId={selectedTermId || undefined} /> : null;

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Term Filter */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <PageHeader
          title="Grade Management"
          description="Comprehensive grade and assessment management system"
        />

        {/* Term Filter */}
        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
          <DataTermFilter
            selectedTermId={selectedTermId}
            onTermChange={handleTermChange}
            showAllOption={false}
            label="Filter by Term"
            showLabel={true}
            size="md"
            includeHistorical={true}
          />
          {selectedTerm && (
            <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
              Showing data for <span className="font-medium text-gray-700 dark:text-gray-300">{selectedTerm.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <Card variant="glass" padding="none">
        <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200 ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                >
                  <Icon
                    className={`mr-2 h-5 w-5 ${activeTab === tab.id
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
      </Card>

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


    </div>
  );
};

export default GradesPage;
