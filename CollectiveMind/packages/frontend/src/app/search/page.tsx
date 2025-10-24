'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  SparklesIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  TagIcon,
  CalendarIcon,
  EyeIcon,
  HeartIcon,
  ShareIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

interface SearchResult {
  id: string;
  type: 'document' | 'message' | 'person';
  title: string;
  content: string;
  author: string;
  team: string;
  date: string;
  tags: string[];
  relevanceScore: number;
  isFavorited?: boolean;
}

const mockResults: SearchResult[] = [
  {
    id: '1',
    type: 'document',
    title: 'Customer Churn Analysis Q3 2024',
    content: 'Our analysis reveals that customer churn has increased by 15% this quarter, primarily driven by pricing concerns and competitive pressure. Key findings include...',
    author: 'Maya Chen',
    team: 'Product',
    date: '2024-10-15',
    tags: ['churn', 'analysis', 'customers', 'retention'],
    relevanceScore: 0.95,
    isFavorited: false
  },
  {
    id: '2',
    type: 'document',
    title: 'Marketing Campaign Performance - Customer Retention',
    content: 'The recent retention campaign showed promising results with a 23% improvement in customer engagement. Collaboration with the Product team on churn insights...',
    author: 'Rahul Sharma',
    team: 'Marketing',
    date: '2024-10-12',
    tags: ['marketing', 'retention', 'campaign', 'collaboration'],
    relevanceScore: 0.87,
    isFavorited: true
  },
  {
    id: '3',
    type: 'message',
    title: 'Discussion: Cross-team churn prevention strategy',
    content: 'Hey team, I think we should connect with Marketing on the churn analysis. They have some great insights on customer behavior patterns that could help...',
    author: 'Maya Chen',
    team: 'Product',
    date: '2024-10-10',
    tags: ['discussion', 'strategy', 'cross-team'],
    relevanceScore: 0.82,
    isFavorited: false
  }
];

const filters = [
  { id: 'all', label: 'All Content', count: 156 },
  { id: 'documents', label: 'Documents', count: 89 },
  { id: 'messages', label: 'Messages', count: 45 },
  { id: 'people', label: 'People', count: 22 },
];

const teams = ['All Teams', 'Product', 'Marketing', 'Engineering', 'Finance', 'HR'];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || 'customer churn';
  
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('All Teams');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (query) {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setResults(mockResults);
        setLoading(false);
      }, 800);
    }
  }, [query]);

  // Handle URL parameter changes
  useEffect(() => {
    const urlQuery = searchParams.get('q');
    if (urlQuery && urlQuery !== query) {
      setQuery(urlQuery);
    }
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setLoading(true);
      setTimeout(() => {
        setResults(mockResults);
        setLoading(false);
      }, 800);
    }
  };

  const toggleFavorite = (id: string) => {
    setResults(results.map(result => 
      result.id === id 
        ? { ...result, isFavorited: !result.isFavorited }
        : result
    ));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return DocumentTextIcon;
      case 'message': return ChatBubbleLeftRightIcon;
      case 'person': return UserIcon;
      default: return DocumentTextIcon;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'document': return 'bg-primary-100 text-primary-700';
      case 'message': return 'bg-accent-100 text-accent-700';
      case 'person': return 'bg-success-100 text-success-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
      <div className="container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="max-w-4xl mx-auto mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              Discover Your Organization's Knowledge
            </h1>
            
            {/* Search Form */}
            <form onSubmit={handleSearch} className="search-container mb-6">
              <div className="relative">
                <MagnifyingGlassIcon className="search-icon" />
                <input
                  type="text"
                  placeholder="Search documents, messages, people, and more..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="search-input"
                />
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Search'
                  )}
                </motion.button>
              </div>
            </form>

            {/* AI Suggestions */}
            <div className="flex flex-wrap gap-2 justify-center">
              {['customer retention strategies', 'cross-team collaboration', 'Q3 performance metrics'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setQuery(suggestion)}
                  className="px-3 py-1 text-sm bg-white border border-gray-200 rounded-full hover:border-primary-300 hover:bg-primary-50 transition-colors duration-200"
                >
                  <SparklesIcon className="w-3 h-3 inline mr-1" />
                  {suggestion}
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="lg:w-64 flex-shrink-0"
            >
              <div className="card sticky top-24">
                <div className="card-header flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Filters</h3>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden p-1 hover:bg-gray-100 rounded"
                  >
                    <FunnelIcon className="w-4 h-4" />
                  </button>
                </div>
                
                <div className={`card-body space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                  {/* Content Type */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Content Type</h4>
                    <div className="space-y-2">
                      {filters.map((filter) => (
                        <button
                          key={filter.id}
                          onClick={() => setActiveFilter(filter.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${
                            activeFilter === filter.id
                              ? 'bg-primary-100 text-primary-700'
                              : 'hover:bg-gray-100 text-gray-600'
                          }`}
                        >
                          <span>{filter.label}</span>
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                            {filter.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Teams */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Teams</h4>
                    <select
                      value={selectedTeam}
                      onChange={(e) => setSelectedTeam(e.target.value)}
                      className="w-full input text-sm"
                    >
                      {teams.map((team) => (
                        <option key={team} value={team}>{team}</option>
                      ))}
                    </select>
                  </div>

                  {/* Date Range */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Date Range</h4>
                    <select className="w-full input text-sm">
                      <option>Last 30 days</option>
                      <option>Last 3 months</option>
                      <option>Last 6 months</option>
                      <option>Last year</option>
                      <option>All time</option>
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Results */}
            <div className="flex-1">
              {query && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="mb-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-gray-600">
                      {loading ? 'Searching...' : `Found ${results.length} results for "${query}"`}
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Sort by:</span>
                      <select className="text-sm border-0 bg-transparent focus:ring-0 text-gray-700">
                        <option>Relevance</option>
                        <option>Date</option>
                        <option>Author</option>
                      </select>
                    </div>
                  </div>

                  {/* AI Insights */}
                  <div className="card mb-6 bg-gradient-to-r from-primary-50 to-accent-50 border-primary-200">
                    <div className="card-body">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <SparklesIcon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">AI Insights</h3>
                          <p className="text-gray-700 text-sm leading-relaxed">
                            I found strong connections between Product and Marketing teams around customer churn. 
                            <strong> Maya's analysis</strong> complements <strong>Rahul's campaign data</strong>. 
                            Consider scheduling a cross-team sync to align on retention strategies.
                          </p>
                          <div className="mt-3 flex items-center space-x-4">
                            <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                              Schedule Meeting
                            </button>
                            <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                              Create Shared Workspace
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Results List */}
              <div className="space-y-4">
                <AnimatePresence>
                  {results.map((result, index) => {
                    const TypeIcon = getTypeIcon(result.type);
                    return (
                      <motion.div
                        key={result.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.4 }}
                        className="card-hover group"
                      >
                        <div className="card-body">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getTypeColor(result.type)}`}>
                                <TypeIcon className="w-4 h-4" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors duration-200">
                                  {result.title}
                                </h3>
                                <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                                  <span className="flex items-center">
                                    <UserIcon className="w-3 h-3 mr-1" />
                                    {result.author}
                                  </span>
                                  <span className="flex items-center">
                                    <TagIcon className="w-3 h-3 mr-1" />
                                    {result.team}
                                  </span>
                                  <span className="flex items-center">
                                    <CalendarIcon className="w-3 h-3 mr-1" />
                                    {new Date(result.date).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <div className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                                {Math.round(result.relevanceScore * 100)}% match
                              </div>
                              <button
                                onClick={() => toggleFavorite(result.id)}
                                className="p-1 hover:bg-gray-100 rounded transition-colors duration-200"
                              >
                                {result.isFavorited ? (
                                  <HeartSolidIcon className="w-4 h-4 text-red-500" />
                                ) : (
                                  <HeartIcon className="w-4 h-4 text-gray-400" />
                                )}
                              </button>
                            </div>
                          </div>

                          <p className="text-gray-700 leading-relaxed mb-4">
                            {result.content}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-2">
                              {result.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="badge-secondary text-xs"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>

                            <div className="flex items-center space-x-3 text-sm text-gray-500">
                              <button className="flex items-center hover:text-gray-700 transition-colors duration-200">
                                <EyeIcon className="w-4 h-4 mr-1" />
                                View
                              </button>
                              <button className="flex items-center hover:text-gray-700 transition-colors duration-200">
                                <ShareIcon className="w-4 h-4 mr-1" />
                                Share
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Load More */}
              {results.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-center mt-8"
                >
                  <button className="btn-secondary">
                    Load More Results
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}