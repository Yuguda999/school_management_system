import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Footer: React.FC = () => {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © {currentYear} School Management System. All rights reserved.
            </p>
          </div>
          
          <div className="flex items-center space-x-6">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Version 1.0.0
            </span>
            {user && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                Logged in as {user.role.replace('_', ' ')}
              </span>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
