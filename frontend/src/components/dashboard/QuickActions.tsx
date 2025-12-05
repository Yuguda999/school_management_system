import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ClipboardDocumentCheckIcon,
    ChartBarIcon,
    CalendarIcon,
    BellIcon,
    CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import Card from '../ui/Card';
import { useSchoolCode } from '../../hooks/useSchoolCode';

const QuickActions: React.FC = () => {
    const navigate = useNavigate();
    const schoolCode = useSchoolCode();

    const actions = [
        {
            name: 'My Tests',
            description: 'Take online tests',
            icon: ClipboardDocumentCheckIcon,
            href: `/${schoolCode}/cbt/student`,
            color: 'bg-red-500',
            lightColor: 'bg-red-100 dark:bg-red-900/30',
            textColor: 'text-red-600 dark:text-red-400'
        },
        {
            name: 'My Grades',
            description: 'View performance',
            icon: ChartBarIcon,
            href: `/${schoolCode}/student/grades`,
            color: 'bg-blue-500',
            lightColor: 'bg-blue-100 dark:bg-blue-900/30',
            textColor: 'text-blue-600 dark:text-blue-400'
        },
        {
            name: 'Timetable',
            description: 'Class schedule',
            icon: CalendarIcon,
            href: `/${schoolCode}/student/timetable`,
            color: 'bg-green-500',
            lightColor: 'bg-green-100 dark:bg-green-900/30',
            textColor: 'text-green-600 dark:text-green-400'
        },
        {
            name: 'Announcements',
            description: 'School updates',
            icon: BellIcon,
            href: `/${schoolCode}/communication`,
            color: 'bg-yellow-500',
            lightColor: 'bg-yellow-100 dark:bg-yellow-900/30',
            textColor: 'text-yellow-600 dark:text-yellow-400'
        },
        {
            name: 'Fees',
            description: 'Check payments',
            icon: CurrencyDollarIcon,
            href: `/${schoolCode}/student/fees`,
            color: 'bg-purple-500',
            lightColor: 'bg-purple-100 dark:bg-purple-900/30',
            textColor: 'text-purple-600 dark:text-purple-400'
        }
    ];

    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
            </h3>
            <div className="space-y-3">
                {actions.map((action) => (
                    <button
                        key={action.name}
                        onClick={() => navigate(action.href)}
                        className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 group border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                    >
                        <div className={`${action.lightColor} ${action.textColor} w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                            <action.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 text-left">
                            <span className="text-sm font-medium text-gray-900 dark:text-white block">
                                {action.name}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {action.description}
                            </span>
                        </div>
                    </button>
                ))}
            </div>
        </Card>
    );
};

export default QuickActions;
