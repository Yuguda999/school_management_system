import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  EyeIcon,
  PencilIcon,
  PrinterIcon,
  CalendarIcon,
  UserIcon,
  AcademicCapIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import { ReportCard as ReportCardType } from '../../types';
import GradeService from '../../services/gradeService';
import { useToast } from '../../hooks/useToast';
import { useCurrentTerm } from '../../hooks/useCurrentTerm';

interface ReportCardListProps {
  refreshTrigger?: number;
}

const ReportCardList: React.FC<ReportCardListProps> = ({ refreshTrigger }) => {
  const [reportCards, setReportCards] = useState<ReportCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useToast();
  const { currentTerm } = useCurrentTerm();

  useEffect(() => {
    fetchReportCards();
  }, [refreshTrigger]);

  const fetchReportCards = async () => {
    try {
      setLoading(true);
      const data = await GradeService.getReportCards({
        term_id: currentTerm?.id,
        page: 1,
        size: 50
      });
      setReportCards(data);
    } catch (error) {
      console.error('Error fetching report cards:', error);
      showError('Failed to load report cards');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPerformanceColor = (averageScore: number) => {
    if (averageScore >= 80) return 'text-green-600 bg-green-50';
    if (averageScore >= 60) return 'text-blue-600 bg-blue-50';
    if (averageScore >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getPerformanceLabel = (averageScore: number) => {
    if (averageScore >= 80) return 'Excellent';
    if (averageScore >= 60) return 'Good';
    if (averageScore >= 40) return 'Average';
    return 'Needs Improvement';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading report cards...</span>
      </div>
    );
  }

  if (reportCards.length === 0) {
    return (
      <div className="card p-8 text-center">
        <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No Report Cards Found
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          No report cards have been generated yet. Create a new report card to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {reportCards.map((reportCard) => (
          <div key={reportCard.id} className="card p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                    <DocumentTextIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {reportCard.student_name || 'Unknown Student'}
                    </h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {reportCard.class_name || 'Unknown Class'}
                    </span>
                    {reportCard.is_published && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Published
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {reportCard.term_name || 'Unknown Term'}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <TrophyIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Position: {reportCard.position || 'N/A'} of {reportCard.total_students || 0}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <AcademicCapIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {reportCard.total_subjects || 0} Subjects
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <UserIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        By {reportCard.generator_name || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Score:</span>
                      <span className={`px-2 py-1 rounded-md text-sm font-semibold ${getPerformanceColor(reportCard.average_score)}`}>
                        {reportCard.average_score.toFixed(1)}% ({getPerformanceLabel(reportCard.average_score)})
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Score:</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {reportCard.total_score.toFixed(1)} points
                      </span>
                    </div>
                  </div>
                  
                  {reportCard.teacher_comment && (
                    <div className="mt-3">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Teacher Comment:</span>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                        {reportCard.teacher_comment}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  className="btn btn-sm btn-outline"
                  title="View Details"
                >
                  <EyeIcon className="w-4 h-4" />
                </button>
                
                {!reportCard.is_published && (
                  <button
                    className="btn btn-sm btn-outline"
                    title="Edit Report Card"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                )}
                
                <button
                  className="btn btn-sm btn-primary"
                  title="Print Report Card"
                >
                  <PrinterIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Generated: {formatDate(reportCard.generated_date)}</span>
                <span>Last updated: {formatDate(reportCard.updated_at)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {reportCards.length > 0 && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          Showing {reportCards.length} report card{reportCards.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default ReportCardList;
