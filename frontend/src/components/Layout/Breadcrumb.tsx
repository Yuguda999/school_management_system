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
      <ol className="flex items-center space-x-2">
        <li>
          <div>
            <Link
              to="/dashboard"
              className="text-gray-400 hover:text-primary-500 dark:text-gray-500 dark:hover:text-primary-400 transition-colors duration-200"
            >
              <HomeIcon className="flex-shrink-0 h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Dashboard</span>
            </Link>
          </div>
        </li>
        {breadcrumbItems.slice(1).map((item, index) => (
          <li key={`${index}-${item.href || item.name}`}>
            <div className="flex items-center">
              <ChevronRightIcon
                className="flex-shrink-0 h-4 w-4 text-gray-300 dark:text-gray-600"
                aria-hidden="true"
              />
              {item.href ? (
                <Link
                  to={item.href}
                  className="ml-2 text-xs font-medium text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors duration-200"
                >
                  {item.name}
                </Link>
              ) : (
                <span className="ml-2 text-xs font-medium text-gray-900 dark:text-white truncate max-w-[150px]">
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
