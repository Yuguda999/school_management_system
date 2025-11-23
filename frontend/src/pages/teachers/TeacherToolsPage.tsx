import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  WrenchScrewdriverIcon,
  CalculatorIcon,
  ClockIcon,
  DocumentTextIcon,
  PresentationChartLineIcon,
  BeakerIcon,
  LanguageIcon,
  MusicalNoteIcon,
  PaintBrushIcon,
  MapIcon,
  CodeBracketIcon,
  CubeIcon,
  SparklesIcon,
  RocketLaunchIcon,
  LightBulbIcon,
  AcademicCapIcon,
  ChartBarIcon,
  CalendarIcon,
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  PencilSquareIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline';
import PageHeader from '../../components/Layout/PageHeader';

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  category: string;
  comingSoon: boolean;
  action?: () => void;
}

const TeacherToolsPage: React.FC = () => {
  const navigate = useNavigate();
  const schoolCode = window.location.pathname.split('/')[1];

  const tools: Tool[] = [
    // Academic Tools
    {
      id: 'grade-calculator',
      name: 'Grade Calculator',
      description: 'Calculate student grades and GPA',
      icon: CalculatorIcon,
      color: 'bg-blue-500',
      category: 'Academic',
      comingSoon: true
    },
    {
      id: 'attendance-tracker',
      name: 'Attendance Tracker',
      description: 'Track and analyze student attendance patterns',
      icon: ClipboardDocumentCheckIcon,
      color: 'bg-green-500',
      category: 'Academic',
      comingSoon: true
    },
    {
      id: 'lesson-planner',
      name: 'AI Lesson Plan Generator',
      description: 'Create comprehensive lesson plans powered by AI',
      icon: CalendarIcon,
      color: 'bg-purple-500',
      category: 'Planning',
      comingSoon: false,
      action: () => navigate(`/${schoolCode}/teacher/tools/lesson-planner`)
    },
    {
      id: 'assignment-generator',
      name: 'AI Assignment Generator',
      description: 'Create comprehensive assignments powered by AI',
      icon: DocumentTextIcon,
      color: 'bg-blue-500',
      category: 'Planning',
      comingSoon: false,
      action: () => navigate(`/${schoolCode}/teacher/tools/assignment-generator`)
    },
    
    // Assessment Tools
    {
      id: 'quiz-maker',
      name: 'Quiz Maker',
      description: 'Create interactive quizzes and tests',
      icon: DocumentTextIcon,
      color: 'bg-indigo-500',
      category: 'Assessment',
      comingSoon: true
    },
    {
      id: 'rubric-builder',
      name: 'AI Rubric Builder',
      description: 'Create comprehensive grading rubrics powered by AI',
      icon: TableCellsIcon,
      color: 'bg-purple-500',
      category: 'Assessment',
      comingSoon: false,
      action: () => navigate(`/${schoolCode}/teacher/tools/rubric-builder`)
    },
    
    // Subject-Specific Tools
    {
      id: 'math-tools',
      name: 'Math Tools',
      description: 'Graphing calculator, equation solver, and more',
      icon: CalculatorIcon,
      color: 'bg-cyan-500',
      category: 'Subject Tools',
      comingSoon: true
    },
    {
      id: 'science-lab',
      name: 'Science Lab Simulator',
      description: 'Virtual lab experiments and simulations',
      icon: BeakerIcon,
      color: 'bg-teal-500',
      category: 'Subject Tools',
      comingSoon: true
    },
    {
      id: 'language-tools',
      name: 'Language Tools',
      description: 'Grammar checker, vocabulary builder',
      icon: LanguageIcon,
      color: 'bg-rose-500',
      category: 'Subject Tools',
      comingSoon: true
    },
    {
      id: 'geography-maps',
      name: 'Geography Maps',
      description: 'Interactive maps and geography tools',
      icon: MapIcon,
      color: 'bg-emerald-500',
      category: 'Subject Tools',
      comingSoon: true
    },
    
    // Creative Tools
    {
      id: 'presentation-maker',
      name: 'Presentation Maker',
      description: 'Create engaging presentations',
      icon: PresentationChartLineIcon,
      color: 'bg-violet-500',
      category: 'Creative',
      comingSoon: true
    },
    {
      id: 'worksheet-designer',
      name: 'Worksheet Designer',
      description: 'Design custom worksheets and handouts',
      icon: DocumentTextIcon,
      color: 'bg-amber-500',
      category: 'Creative',
      comingSoon: true
    },
    {
      id: 'art-studio',
      name: 'Digital Art Studio',
      description: 'Drawing and design tools for art classes',
      icon: PaintBrushIcon,
      color: 'bg-fuchsia-500',
      category: 'Creative',
      comingSoon: true
    },
    
    // Productivity Tools
    {
      id: 'timer',
      name: 'Class Timer',
      description: 'Countdown timer for activities and breaks',
      icon: ClockIcon,
      color: 'bg-red-500',
      category: 'Productivity',
      comingSoon: true
    },
    {
      id: 'random-selector',
      name: 'Random Student Selector',
      description: 'Randomly select students for participation',
      icon: SparklesIcon,
      color: 'bg-yellow-500',
      category: 'Productivity',
      comingSoon: true
    },
    {
      id: 'seating-chart',
      name: 'Seating Chart Generator',
      description: 'Create and manage classroom seating arrangements',
      icon: CubeIcon,
      color: 'bg-lime-500',
      category: 'Productivity',
      comingSoon: true
    },
    
    // Advanced Tools
    {
      id: 'ai-assistant',
      name: 'AI Teaching Assistant',
      description: 'AI-powered help for lesson planning and grading',
      icon: RocketLaunchIcon,
      color: 'bg-sky-500',
      category: 'Advanced',
      comingSoon: true
    },
    {
      id: 'analytics',
      name: 'Student Analytics',
      description: 'Deep insights into student performance',
      icon: ChartBarIcon,
      color: 'bg-slate-500',
      category: 'Advanced',
      comingSoon: true
    },
    {
      id: 'resource-library',
      name: 'Resource Library',
      description: 'Access curated teaching resources',
      icon: BookOpenIcon,
      color: 'bg-stone-500',
      category: 'Advanced',
      comingSoon: true
    }
  ];

  const categories = Array.from(new Set(tools.map(tool => tool.category)));

  const handleToolClick = (tool: Tool) => {
    if (tool.action) {
      tool.action();
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teacher Tools"
        description="Powerful tools to enhance your teaching experience"
        icon={WrenchScrewdriverIcon}
      />

      {/* Coming Soon Banner */}
      <div className="card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <LightBulbIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Exciting Tools Coming Soon!
            </h3>
            <p className="text-blue-700 dark:text-blue-300 mb-3">
              We're building a comprehensive suite of teaching tools to make your work easier and more effective. 
              These tools will help you with lesson planning, grading, assessments, and much more.
            </p>
            <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
              <SparklesIcon className="h-5 w-5" />
              <span className="font-medium">Stay tuned for updates!</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tools by Category */}
      {categories.map(category => (
        <div key={category} className="space-y-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {category}
            </h2>
            <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
              {tools.filter(t => t.category === category).length} tools
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools
              .filter(tool => tool.category === category)
              .map(tool => (
                <div
                  key={tool.id}
                  className={`card p-6 transition-all duration-200 ${
                    tool.comingSoon
                      ? 'opacity-75 cursor-not-allowed'
                      : 'hover:shadow-lg cursor-pointer transform hover:-translate-y-1'
                  }`}
                  onClick={() => !tool.comingSoon && handleToolClick(tool)}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`flex-shrink-0 p-3 rounded-lg ${tool.color}`}>
                      <tool.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                          {tool.name}
                        </h3>
                        {tool.comingSoon && (
                          <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full whitespace-nowrap">
                            Soon
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}

      {/* Request a Tool Section */}
      <div className="card p-6 bg-gray-50 dark:bg-gray-800/50">
        <div className="text-center">
          <RocketLaunchIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Have a Tool Idea?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-2xl mx-auto">
            We're always looking to add tools that make teaching easier. 
            If you have suggestions for tools you'd like to see, let us know!
          </p>
          <button
            className="btn btn-primary"
            onClick={() => navigate(`/${window.location.pathname.split('/')[1]}/communication`)}
          >
            Send Feedback
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherToolsPage;

