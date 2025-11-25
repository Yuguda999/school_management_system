import React from 'react';
import Breadcrumb from './Breadcrumb';

interface BreadcrumbItem {
  name: string;
  href?: string;
  current?: boolean;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  children?: React.ReactNode;
  variant?: 'default' | 'compact' | 'transparent';
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs,
  actions,
  children,
  variant = 'default'
}) => {
  if (variant === 'compact') {
    return (
      <div className="mb-4 sm:mb-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              {title}
            </h1>
            {description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 flex-wrap">
              {actions}
            </div>
          )}
        </div>
        {children && <div className="mt-4">{children}</div>}
      </div>
    );
  }

  return (
    <div className="mb-6 sm:mb-8 animate-fade-in">
      {/* Breadcrumbs - Integrated seamlessly */}
      <div className="mb-2 overflow-x-auto">
        <Breadcrumb items={breadcrumbs} />
      </div>

      <div className="relative">
        {/* Main Header Content */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
              {title}
            </h1>
            {description && (
              <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-3xl leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {actions && (
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap md:flex-nowrap flex-shrink-0">
              {actions}
            </div>
          )}
        </div>

        {/* Decorative underline/accent */}
        <div className="absolute -bottom-4 left-0 w-full h-px bg-gradient-to-r from-gray-200 via-gray-100 to-transparent dark:from-gray-700 dark:via-gray-800 dark:to-transparent opacity-50"></div>
      </div>

      {/* Additional content */}
      {children && (
        <div className="mt-6 sm:mt-8">
          {children}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
