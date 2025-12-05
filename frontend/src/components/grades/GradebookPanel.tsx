/**
 * Gradebook Panel Component (P2.2)
 * Unified assessment and gradebook automation
 */

import React, { useEffect, useState } from 'react';
import {
  TableCellsIcon,
  ArrowDownTrayIcon,
  CalculatorIcon
} from '@heroicons/react/24/outline';
import gradebookService, { GradebookEntry, GradebookSummary, GradebookFilters } from '../../services/gradebookService';
import { useSchoolCode } from '../../hooks/useSchoolCode';
import LoadingSpinner from '../ui/LoadingSpinner';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface GradebookPanelProps {
  classId?: string;
  subjectId?: string;
  termId?: string;
}

const GradebookPanel: React.FC<GradebookPanelProps> = ({ classId, subjectId, termId }) => {
  const schoolCode = useSchoolCode();
  const [entries, setEntries] = useState<GradebookEntry[]>([]);
  const [summary, setSummary] = useState<GradebookSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const selectedClassId = classId;
  const selectedSubjectId = subjectId;
  const selectedTermId = termId;

  const fetchGradebook = async () => {
    if (!schoolCode || !selectedClassId || !selectedSubjectId || !selectedTermId) return;
    try {
      setLoading(true);
      const filters: GradebookFilters = { class_id: selectedClassId, subject_id: selectedSubjectId, term_id: selectedTermId };
      const data = await gradebookService.getGradebook(schoolCode, filters);
      setEntries(data.entries);
      setSummary(data.summary);
    } catch (err) {
      console.error('Failed to load gradebook:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGradebook();
  }, [schoolCode, selectedClassId, selectedSubjectId, selectedTermId]);

  const handleCalculateGrades = async () => {
    if (!schoolCode || !selectedClassId || !selectedSubjectId || !selectedTermId) return;
    try {
      await gradebookService.calculateFinalGrades(schoolCode, { class_id: selectedClassId, subject_id: selectedSubjectId, term_id: selectedTermId });
      fetchGradebook();
    } catch (err) {
      console.error('Failed to calculate grades:', err);
    }
  };

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    if (!schoolCode || !selectedClassId || !selectedSubjectId || !selectedTermId) return;
    try {
      const blob = await gradebookService.exportGradebook(schoolCode, { class_id: selectedClassId, subject_id: selectedSubjectId, term_id: selectedTermId }, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gradebook.${format}`;
      a.click();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  if (!selectedClassId || !selectedSubjectId || !selectedTermId) {
    return (
      <Card className="p-8 text-center">
        <TableCellsIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
          Select Class, Subject, and Term
        </h3>
        <p className="text-sm text-gray-500">
          Choose a class, subject, and term from the filters above to view the gradebook.
        </p>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
          <TableCellsIcon className="h-6 w-6 mr-2 text-primary-500" />
          Gradebook
        </h2>
        <div className="flex space-x-2">
          <Button onClick={handleCalculateGrades} variant="outline" size="sm">
            <CalculatorIcon className="h-4 w-4 mr-1" />
            Calculate
          </Button>
          <Button onClick={() => handleExport('excel')} variant="outline" size="sm">
            <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-primary-600">{summary.class_average.toFixed(1)}%</p>
            <p className="text-xs text-gray-500">Class Average</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{summary.highest_score.toFixed(1)}%</p>
            <p className="text-xs text-gray-500">Highest</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{summary.lowest_score.toFixed(1)}%</p>
            <p className="text-xs text-gray-500">Lowest</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{summary.pass_rate.toFixed(0)}%</p>
            <p className="text-xs text-gray-500">Pass Rate</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-purple-600">{summary.graded_students}/{summary.total_students}</p>
            <p className="text-xs text-gray-500">Graded</p>
          </Card>
        </div>
      )}

      {/* Gradebook Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                {entries[0]?.components.map((comp) => (
                  <th key={comp.component_id} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {comp.component_name}
                    <span className="block text-gray-400 font-normal">({comp.weight}%)</span>
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {entries.map((entry) => (
                <tr key={entry.student_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{entry.student_name}</p>
                      <p className="text-xs text-gray-500">{entry.admission_number}</p>
                    </div>
                  </td>
                  {entry.components.map((comp) => (
                    <td key={comp.component_id} className="px-4 py-3 text-center whitespace-nowrap">
                      <span className={`${comp.score !== undefined ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                        {comp.score !== undefined ? comp.score.toFixed(1) : '-'}
                      </span>
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center whitespace-nowrap font-semibold text-gray-900 dark:text-white">
                    {entry.total_score.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      entry.grade === 'A' ? 'bg-green-100 text-green-700' :
                      entry.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                      entry.grade === 'C' ? 'bg-yellow-100 text-yellow-700' :
                      entry.grade === 'D' ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {entry.grade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default GradebookPanel;

