/**
 * Smart Resource Search Component (P3.2)
 * AI-powered search for teaching materials
 */

import React, { useState, useCallback } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentIcon,
  VideoCameraIcon,
  PhotoIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import materialsService, { MaterialSearchResult, MaterialType, DifficultyLevel } from '../../services/materialsService';
import { useSchoolCode } from '../../hooks/useSchoolCode';
import LoadingSpinner from '../ui/LoadingSpinner';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface SmartResourceSearchProps {
  onSelectMaterial?: (material: MaterialSearchResult) => void;
  subjectId?: string;
  classId?: string;
}

const SmartResourceSearch: React.FC<SmartResourceSearchProps> = ({ onSelectMaterial, subjectId, classId }) => {
  const schoolCode = useSchoolCode();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MaterialSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    difficulty_level: undefined as DifficultyLevel | undefined,
    material_type: undefined as MaterialType | undefined,
    exam_type: ''
  });

  const handleSearch = useCallback(async () => {
    if (!schoolCode || !query.trim()) return;
    try {
      setLoading(true);
      const response = await materialsService.smartSearch(schoolCode, {
        query: query.trim(),
        subject_id: subjectId,
        class_id: classId,
        difficulty_level: filters.difficulty_level,
        material_type: filters.material_type,
        exam_type: filters.exam_type || undefined,
        limit: 20
      });
      setResults(response.results);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  }, [schoolCode, query, subjectId, classId, filters]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const materialTypeIcons: Record<string, React.ReactNode> = {
    document: <DocumentIcon className="h-5 w-5" />,
    presentation: <DocumentIcon className="h-5 w-5" />,
    video: <VideoCameraIcon className="h-5 w-5" />,
    image: <PhotoIcon className="h-5 w-5" />,
    link: <LinkIcon className="h-5 w-5" />,
    other: <DocumentIcon className="h-5 w-5" />
  };

  const clearFilters = () => {
    setFilters({
      difficulty_level: undefined,
      material_type: undefined,
      exam_type: ''
    });
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex space-x-2">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search materials by topic, title, or keywords..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <Button onClick={() => setShowFilters(!showFilters)} variant="outline">
          <FunnelIcon className="h-5 w-5" />
        </Button>
        <Button onClick={handleSearch} disabled={!query.trim()}>
          Search
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 dark:text-white">Filters</h4>
            <button onClick={clearFilters} className="text-sm text-primary-600 hover:underline">
              Clear all
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Difficulty</label>
              <select
                value={filters.difficulty_level || ''}
                onChange={(e) => setFilters({ ...filters, difficulty_level: e.target.value as DifficultyLevel || undefined })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              >
                <option value="">Any</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Type</label>
              <select
                value={filters.material_type || ''}
                onChange={(e) => setFilters({ ...filters, material_type: e.target.value as MaterialType || undefined })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              >
                <option value="">Any</option>
                <option value="document">Document</option>
                <option value="presentation">Presentation</option>
                <option value="video">Video</option>
                <option value="image">Image</option>
                <option value="link">Link</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Exam Type</label>
              <input
                type="text"
                value={filters.exam_type}
                onChange={(e) => setFilters({ ...filters, exam_type: e.target.value })}
                placeholder="e.g., WAEC, JAMB"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner size="lg" />
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">{results.length} results found</p>
          {results.map((material) => (
            <Card
              key={material.id}
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              onClick={() => onSelectMaterial?.(material)}
            >
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                  {materialTypeIcons[material.material_type] || materialTypeIcons.other}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white truncate">{material.title}</h4>
                  {material.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">{material.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {material.subject_name && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{material.subject_name}</span>
                    )}
                    {material.difficulty_level && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">{material.difficulty_level}</span>
                    )}
                    {material.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">#{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="text-right text-xs text-gray-400">
                  <p>{material.view_count} views</p>
                  <p>{material.download_count} downloads</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : query && !loading ? (
        <Card className="p-8 text-center">
          <MagnifyingGlassIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No materials found. Try different keywords.</p>
        </Card>
      ) : null}
    </div>
  );
};

export default SmartResourceSearch;

