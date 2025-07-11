import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

interface BreadcrumbItem {
  name: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  const location = useLocation();

  // Generate breadcrumb items from current path if not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { name: 'Dashboard', href: '/dashboard' }
    ];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Skip dashboard as it's already added
      if (segment === 'dashboard') return;
      
      const isLast = index === pathSegments.length - 1;
      const name = segment.charAt(0).toUpperCase() + segment.slice(1).replace('-', ' ');
      
      breadcrumbs.push({
        name,
        href: isLast ? undefined : currentPath,
        current: isLast
      });
    });

    return breadcrumbs;
  };

  const breadcrumbItems = items || generateBreadcrumbs();

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-4">
        <li>
          <div>
            <Link 
              to="/dashboard" 
              className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 transition-colors duration-200"
            >
              <HomeIcon className="flex-shrink-0 h-5 w-5" aria-hidden="true" />
              <span className="sr-only">Dashboard</span>
            </Link>
          </div>
        </li>
        {breadcrumbItems.slice(1).map((item) => (
          <li key={item.name}>
            <div className="flex items-center">
              <ChevronRightIcon 
                className="flex-shrink-0 h-5 w-5 text-gray-400 dark:text-gray-500" 
                aria-hidden="true" 
              />
              {item.href ? (
                <Link
                  to={item.href}
                  className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors duration-200"
                >
                  {item.name}
                </Link>
              ) : (
                <span className="ml-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {item.name}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
