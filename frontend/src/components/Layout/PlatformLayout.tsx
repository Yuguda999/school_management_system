import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import PlatformSidebar from './PlatformSidebar';
import PlatformHeader from './PlatformHeader';
import PlatformMobileNavigation from './PlatformMobileNavigation';

const PlatformLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-50 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-800 shadow-2xl animate-slide-in-right">
          <PlatformSidebar onClose={() => setSidebarOpen(false)} />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div
        className="hidden md:flex md:flex-shrink-0 z-20 shadow-xl transition-all duration-300"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        style={{ width: isHovering ? '18rem' : '5rem' }}
      >
        <div className="flex flex-col w-full">
          <PlatformSidebar isCollapsed={!isHovering} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden relative">
        {/* Background Elements */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-900/10"></div>
          <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-purple-100/30 dark:bg-purple-900/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-blue-100/30 dark:bg-blue-900/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
          <PlatformHeader onMenuClick={() => setSidebarOpen(true)} />

          {/* Page content */}
          <main className="flex-1 relative overflow-y-auto focus:outline-none custom-scrollbar">
            <div className="py-8 pb-24 md:pb-8">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 animate-fade-in">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <PlatformMobileNavigation />
    </div>
  );
};

export default PlatformLayout;
