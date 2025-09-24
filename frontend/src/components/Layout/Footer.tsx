import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ThemeAwareLogo from '../ui/ThemeAwareLogo';

const Footer: React.FC = () => {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">

        {/* Copyright */}
          <p className="text-xs text-center text-gray-400 dark:text-gray-500">
            © {currentYear} School Management System Platform. All rights reserved.
          </p>
      </div>
    </footer>
  );
};

export default Footer;
