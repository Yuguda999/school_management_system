import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import SchoolSidebar from './SchoolSidebar';
import SchoolHeader from './SchoolHeader';
import SchoolMobileNavigation from './SchoolMobileNavigation';
import Footer from './Footer';
import { useAuth } from '../../contexts/AuthContext';

const SchoolLayout: React.FC = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Use school ID to create unique keys for components that need to re-render
  const schoolKey = user?.school?.id || 'no-school';

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-800">
          <SchoolSidebar key={`mobile-${schoolKey}`} onClose={() => setSidebarOpen(false)} />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <SchoolSidebar key={`desktop-${schoolKey}`} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <SchoolHeader key={`header-${schoolKey}`} onMenuClick={() => setSidebarOpen(true)} />
        
        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6 pb-20 md:pb-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet key={`content-${schoolKey}`} />
            </div>
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>

      {/* Mobile bottom navigation */}
      <SchoolMobileNavigation />
    </div>
  );
};

export default SchoolLayout;
