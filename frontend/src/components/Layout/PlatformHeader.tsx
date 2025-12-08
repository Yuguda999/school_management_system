import React, { useState, useEffect, useRef } from 'react';
import { Bars3Icon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import NotificationBell from '../Notifications/NotificationBell';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from '../ui/ThemeToggle';
import { Combobox, Transition } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';
import { searchService, SearchResult } from '../../services/searchService';
import { UserCircleIcon, BookOpenIcon, AcademicCapIcon, UserGroupIcon } from '@heroicons/react/24/solid';

interface PlatformHeaderProps {
  onMenuClick: () => void;
}

const PlatformHeader: React.FC<PlatformHeaderProps> = ({ onMenuClick }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 2) {
        setIsSearching(true);
        try {
          const data = await searchService.search(query);
          setResults(data);
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    if (result) {
      navigate(result.url);
      setQuery(''); // Clear search after selection
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'student': return <AcademicCapIcon className="h-5 w-5 text-blue-500" />;
      case 'teacher':
      case 'staff': return <UserCircleIcon className="h-5 w-5 text-green-500" />;
      case 'subject': return <BookOpenIcon className="h-5 w-5 text-purple-500" />;
      case 'class': return <UserGroupIcon className="h-5 w-5 text-orange-500" />;
      default: return <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800 sticky top-0">
      <button
        type="button"
        className="px-4 border-r border-gray-200 dark:border-gray-700 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden"
        onClick={onMenuClick}
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      <div className="flex-1 px-4 flex justify-between items-center">
        {/* Search Bar */}
        <div className="flex-1 flex max-w-lg ml-4 md:ml-0 relative">
          <Combobox onChange={handleSelect} value={null}>
            <div className="relative w-full">
              <div className="relative w-full text-gray-400 focus-within:text-gray-600 dark:focus-within:text-gray-300">
                <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none pl-3">
                  <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
                </div>
                <Combobox.Input
                  className="block w-full h-full pl-10 pr-3 py-2 border-transparent text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-0 focus:border-transparent sm:text-sm bg-transparent"
                  placeholder="Search students, teachers, subjects..."
                  onChange={(event) => setQuery(event.target.value)}
                  displayValue={() => query}
                  autoComplete="off"
                />
              </div>
              <Transition
                as={React.Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
                afterLeave={() => setQuery('')}
              >
                <Combobox.Options className="absolute mt-1 max-h-96 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-50">
                  {results.length === 0 && query.length >= 2 && !isSearching ? (
                    <div className="relative cursor-default select-none py-2 px-4 text-gray-700 dark:text-gray-200">
                      Nothing found.
                    </div>
                  ) : (
                    results.map((result) => (
                      <Combobox.Option
                        key={result.id}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-100'
                          }`
                        }
                        value={result}
                      >
                        {({ selected, active }) => (
                          <>
                            <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-gray-500'}`}>
                              {getIcon(result.type)}
                            </span>
                            <div className="flex flex-col">
                              <span className={`block truncate font-medium ${selected ? 'font-semibold' : 'font-normal'}`}>
                                {result.title}
                              </span>
                              <span className={`block truncate text-xs ${active ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>
                                {result.subtitle}
                              </span>
                            </div>
                          </>
                        )}
                      </Combobox.Option>
                    ))
                  )}
                </Combobox.Options>
              </Transition>
            </div>
          </Combobox>
        </div>

        <div className="ml-4 flex items-center md:ml-6 space-x-2">
          <ThemeToggle />

          {/* Notifications */}
          <NotificationBell />

          {/* Separator */}
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>

          {/* User info */}
          <div className="flex items-center">
            <div className="hidden md:block text-right mr-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {user?.first_name}
              </p>
            </div>
            <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm ring-2 ring-white dark:ring-gray-800 cursor-pointer hover:ring-blue-500 transition-all">
              <span className="text-xs font-bold text-white">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformHeader;
