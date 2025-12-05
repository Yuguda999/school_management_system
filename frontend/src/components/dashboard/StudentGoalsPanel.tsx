/**
 * Student Goals Panel Component (P2.5)
 * Displays goal setting and progress tracking for students
 */

import React, { useEffect, useState } from 'react';
import {
  FlagIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import goalsService, { StudentGoal, GoalCategory, GoalStatus, GoalCreate } from '../../services/goalsService';
import { useSchoolCode } from '../../hooks/useSchoolCode';
import LoadingSpinner from '../ui/LoadingSpinner';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

interface StudentGoalsPanelProps {
  studentId?: string; // If provided, shows goals for specific student (teacher view)
}

const StudentGoalsPanel: React.FC<StudentGoalsPanelProps> = ({ studentId }) => {
  const schoolCode = useSchoolCode();
  const [goals, setGoals] = useState<StudentGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGoal, setNewGoal] = useState<GoalCreate>({
    title: '',
    category: 'academic',
    description: ''
  });

  const fetchGoals = async () => {
    if (!schoolCode) return;
    try {
      setLoading(true);
      const data = studentId
        ? await goalsService.getStudentGoals(schoolCode, studentId)
        : await goalsService.getMyGoals(schoolCode);
      console.log('Goals data:', data);
      // Check if data is an array (old format) or object with items (new format)
      if (Array.isArray(data)) {
        setGoals(data);
      } else if (data && Array.isArray(data.items)) {
        setGoals(data.items);
      } else {
        console.error('Unexpected goals data format:', data);
        setGoals([]);
      }
    } catch (err) {
      console.error('Failed to load goals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [schoolCode, studentId]);

  const handleCreateGoal = async () => {
    if (!schoolCode || !newGoal.title) return;
    try {
      await goalsService.createGoal(schoolCode, newGoal, studentId);
      setShowCreateModal(false);
      setNewGoal({ title: '', category: 'academic', description: '' });
      fetchGoals();
    } catch (err) {
      console.error('Failed to create goal:', err);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!schoolCode) return;
    try {
      await goalsService.deleteGoal(schoolCode, goalId);
      fetchGoals();
    } catch (err) {
      console.error('Failed to delete goal:', err);
    }
  };

  const handleUpdateStatus = async (goalId: string, status: GoalStatus) => {
    if (!schoolCode) return;
    try {
      await goalsService.updateGoal(schoolCode, goalId, { status });
      fetchGoals();
    } catch (err) {
      console.error('Failed to update goal:', err);
    }
  };

  const categoryColors: Record<GoalCategory, string> = {
    academic: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    attendance: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    behavior: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
    extracurricular: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
    personal: 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300'
  };

  const statusIcons: Record<GoalStatus, React.ReactNode> = {
    not_started: <ClockIcon className="h-5 w-5 text-gray-400" />,
    in_progress: <ClockIcon className="h-5 w-5 text-blue-500" />,
    completed: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
    abandoned: <TrashIcon className="h-5 w-5 text-red-500" />
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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
          <FlagIcon className="h-6 w-6 mr-2 text-primary-500" />
          My Goals
        </h2>
        <Button onClick={() => setShowCreateModal(true)} size="sm">
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Goal
        </Button>
      </div>

      {goals.length === 0 ? (
        <Card className="p-8 text-center">
          <FlagIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No goals set yet. Create your first goal!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => (
            <Card key={goal.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {statusIcons[goal.status]}
                    <h3 className="font-semibold text-gray-900 dark:text-white">{goal.title}</h3>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[goal.category]}`}>
                    {goal.category}
                  </span>
                  {goal.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{goal.description}</p>
                  )}
                  {goal.target_date && (
                    <p className="text-xs text-gray-400 mt-2">Due: {new Date(goal.target_date).toLocaleDateString()}</p>
                  )}
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <div className="text-right">
                    <span className="text-2xl font-bold text-primary-600">{goal.progress_percentage}%</span>
                  </div>
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${goal.progress_percentage}%` }}
                    />
                  </div>
                </div>
              </div>
              {goal.status !== 'completed' && goal.status !== 'abandoned' && (
                <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(goal.id, 'completed')}>
                    Mark Complete
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDeleteGoal(goal.id)}>
                    Delete
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create Goal Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Goal">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
            <input
              type="text"
              value={newGoal.title}
              onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              placeholder="Enter goal title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <select
              value={newGoal.category}
              onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value as GoalCategory })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            >
              <option value="academic">Academic</option>
              <option value="attendance">Attendance</option>
              <option value="behavior">Behavior</option>
              <option value="extracurricular">Extracurricular</option>
              <option value="personal">Personal</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              value={newGoal.description || ''}
              onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              rows={3}
              placeholder="Describe your goal"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button onClick={handleCreateGoal} disabled={!newGoal.title}>Create Goal</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StudentGoalsPanel;

