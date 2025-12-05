/**
 * Curriculum Coverage Panel Component (P2.3)
 * Displays curriculum coverage tracking for teachers
 */

import React, { useEffect, useState } from 'react';
import {
  BookOpenIcon,
  CheckCircleIcon,
  ClockIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import curriculumService, { CoverageStats, SubjectCoverage } from '../../services/curriculumService';
import { useSchoolCode } from '../../hooks/useSchoolCode';
import LoadingSpinner from '../ui/LoadingSpinner';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface CurriculumCoveragePanelProps {
  classId?: string;
  termId?: string;
}

const CurriculumCoveragePanel: React.FC<CurriculumCoveragePanelProps> = ({ classId, termId }) => {
  const schoolCode = useSchoolCode();
  const [stats, setStats] = useState<CoverageStats | null>(null);
  const [subjects, setSubjects] = useState<SubjectCoverage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  const fetchCoverage = async () => {
    if (!schoolCode) return;
    try {
      setLoading(true);
      const data = await curriculumService.getCoverageAnalytics(schoolCode, classId, termId);
      setStats(data.stats);
      setSubjects(data.by_subject);
    } catch (err) {
      console.error('Failed to load coverage:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoverage();
  }, [schoolCode, classId, termId]);

  const handleMarkDelivered = async (lessonId: string) => {
    if (!schoolCode) return;
    try {
      await curriculumService.markLessonDelivered(schoolCode, lessonId);
      fetchCoverage();
    } catch (err) {
      console.error('Failed to mark lesson delivered:', err);
    }
  };

  const statusColors = {
    not_started: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    skipped: 'bg-yellow-100 text-yellow-700'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
        <BookOpenIcon className="h-6 w-6 mr-2 text-primary-500" />
        Curriculum Coverage
      </h2>

      {/* Overall Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold text-primary-600">{stats.overall_coverage_percentage.toFixed(0)}%</p>
            <p className="text-sm text-gray-500">Overall Coverage</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{stats.completed_units}</p>
            <p className="text-sm text-gray-500">Completed Units</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{stats.in_progress_units}</p>
            <p className="text-sm text-gray-500">In Progress</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold text-purple-600">{stats.lesson_delivery_rate.toFixed(0)}%</p>
            <p className="text-sm text-gray-500">Lessons Delivered</p>
          </Card>
        </div>
      )}

      {/* Subject Coverage */}
      <div className="space-y-4">
        {subjects.map((subject) => (
          <Card key={subject.subject_id} className="overflow-hidden">
            <div
              className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => setExpandedSubject(expandedSubject === subject.subject_id ? null : subject.subject_id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{subject.subject_name}</h3>
                  <p className="text-sm text-gray-500">{subject.completed_units} / {subject.total_units} units completed</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <span className="text-2xl font-bold text-primary-600">{subject.coverage_percentage.toFixed(0)}%</span>
                  </div>
                  <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${subject.coverage_percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Expanded Units */}
            {expandedSubject === subject.subject_id && (
              <div className="border-t border-gray-100 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
                <div className="space-y-3">
                  {subject.units.map((unit) => (
                    <div key={unit.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[unit.coverage_status]}`}>
                            {unit.coverage_status.replace('_', ' ')}
                          </span>
                          <h4 className="font-medium text-gray-900 dark:text-white">{unit.title}</h4>
                        </div>
                        <span className="text-sm text-gray-500">{unit.coverage_percentage}%</span>
                      </div>

                      {/* Lesson Plans */}
                      {unit.lesson_plans && unit.lesson_plans.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {unit.lesson_plans.map((lesson) => (
                            <div key={lesson.id} className="flex items-center justify-between text-sm py-1 px-2 rounded bg-gray-50 dark:bg-gray-700">
                              <div className="flex items-center space-x-2">
                                {lesson.is_delivered ? (
                                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                                ) : (
                                  <ClockIcon className="h-4 w-4 text-gray-400" />
                                )}
                                <span className={lesson.is_delivered ? 'text-gray-500 line-through' : 'text-gray-700 dark:text-gray-300'}>
                                  {lesson.title}
                                </span>
                              </div>
                              {!lesson.is_delivered && (
                                <Button size="sm" variant="ghost" onClick={() => handleMarkDelivered(lesson.id)}>
                                  <PlayIcon className="h-3 w-3 mr-1" />
                                  Mark Done
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CurriculumCoveragePanel;

