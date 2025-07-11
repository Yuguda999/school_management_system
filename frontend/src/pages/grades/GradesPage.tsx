import React from 'react';

const GradesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Grades</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Manage student grades and assessments
        </p>
      </div>
      
      <div className="card p-8 text-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Grade Management
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Grade management interface will be implemented here.
        </p>
      </div>
    </div>
  );
};

export default GradesPage;
