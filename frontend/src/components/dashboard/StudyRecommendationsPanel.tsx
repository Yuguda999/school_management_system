/**
 * Study Recommendations Panel Component (P2.7)
 * Displays AI-powered study recommendations for students
 */

import React, { useEffect, useState } from 'react';
import {
  LightBulbIcon,
  AcademicCapIcon,
  BookOpenIcon,
  ClockIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import analyticsService, { StudentRecommendation } from '../../services/analyticsService';
import { useSchoolCode } from '../../hooks/useSchoolCode';
import LoadingSpinner from '../ui/LoadingSpinner';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface StudyRecommendationsPanelProps {
  studentId?: string;
}

const StudyRecommendationsPanel: React.FC<StudyRecommendationsPanelProps> = ({ studentId }) => {
  const schoolCode = useSchoolCode();
  const [recommendations, setRecommendations] = useState<StudentRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    if (!schoolCode) return;
    try {
      setLoading(true);
      const data = await analyticsService.getStudentRecommendations(schoolCode, studentId);
      setRecommendations(data.recommendations);
    } catch (err) {
      setError('Failed to load recommendations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [schoolCode, studentId]);

  const priorityColors: Record<string, string> = {
    high: 'border-l-red-500 bg-red-50 dark:bg-red-900/10',
    medium: 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10',
    low: 'border-l-green-500 bg-green-50 dark:bg-green-900/10'
  };

  const categoryIcons: Record<string, React.ReactNode> = {
    focus_area: <BookOpenIcon className="h-5 w-5" />,
    strength: <AcademicCapIcon className="h-5 w-5" />,
    attendance: <ClockIcon className="h-5 w-5" />,
    default: <LightBulbIcon className="h-5 w-5" />
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-red-500">{error}</p>
        <Button onClick={fetchRecommendations} className="mt-4" size="sm">
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
          <SparklesIcon className="h-6 w-6 mr-2 text-yellow-500" />
          Smart Study Recommendations
        </h2>
        <Button onClick={fetchRecommendations} size="sm" variant="outline">
          Refresh
        </Button>
      </div>

      {recommendations.length === 0 ? (
        <Card className="p-8 text-center">
          <LightBulbIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            No recommendations available yet. Keep studying and check back later!
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <Card
              key={index}
              className={`p-4 border-l-4 ${priorityColors[rec.priority] || priorityColors.low}`}
            >
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                  {categoryIcons[rec.type] || categoryIcons.default}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{rec.type === 'focus_area' ? `Focus: ${rec.subject}` : rec.type === 'strength' ? `Strength: ${rec.subject}` : 'Attendance'}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                        rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                      }`}>
                      {rec.priority} priority
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{rec.message}</p>
                  {rec.suggested_actions && rec.suggested_actions.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Action Items:</p>
                      <ul className="space-y-1">
                        {rec.suggested_actions.map((item, i) => (
                          <li key={i} className="flex items-start text-sm text-gray-600 dark:text-gray-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 mr-2 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudyRecommendationsPanel;

