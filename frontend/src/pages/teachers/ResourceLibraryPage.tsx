/**
 * Resource Library Page
 * Smart resource library with AI-powered search for teaching materials
 */

import React from 'react';
import {
  BookOpenIcon,
  FolderIcon,
  DocumentPlusIcon
} from '@heroicons/react/24/outline';
import PageHeader from '../../components/Layout/PageHeader';
import SmartResourceSearch from '../../components/materials/SmartResourceSearch';
import Card from '../../components/ui/Card';

const ResourceLibraryPage: React.FC = () => {
  const handleSelectMaterial = (material: any) => {
    // Open material in new tab
    if (material.file_url) {
      window.open(material.file_url, '_blank');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Smart Resource Library"
        description="AI-powered search and organization of teaching materials"
      />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="glass" className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <DocumentPlusIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Upload Material</h3>
              <p className="text-sm text-gray-500">Add new teaching resources</p>
            </div>
          </div>
        </Card>

        <Card variant="glass" className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
              <FolderIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">My Folders</h3>
              <p className="text-sm text-gray-500">Organize your materials</p>
            </div>
          </div>
        </Card>

        <Card variant="glass" className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
              <BookOpenIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Recent Materials</h3>
              <p className="text-sm text-gray-500">View recently accessed</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Smart Search */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Search Materials
        </h2>
        <SmartResourceSearch onSelectMaterial={handleSelectMaterial} />
      </div>
    </div>
  );
};

export default ResourceLibraryPage;

