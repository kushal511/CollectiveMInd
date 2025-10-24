'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  PlusIcon,
  UserPlusIcon,
  Cog6ToothIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const teams = [
  {
    id: 1,
    name: 'Engineering',
    description: 'Building the future of technology',
    members: 24,
    documents: 156,
    searches: 1247,
    color: 'bg-blue-500',
    avatar: '👨‍💻',
    lead: 'Sarah Chen',
    recentActivity: 'Updated API documentation',
    tags: ['Backend', 'Frontend', 'DevOps', 'Mobile']
  },
  {
    id: 2,
    name: 'Product',
    description: 'Defining product strategy and roadmap',
    members: 12,
    documents: 89,
    searches: 892,
    color: 'bg-green-500',
    avatar: '📱',
    lead: 'Mike Johnson',
    recentActivity: 'Published Q4 roadmap',
    tags: ['Strategy', 'Research', 'Analytics', 'UX']
  },
  {
    id: 3,
    name: 'Marketing',
    description: 'Growing our brand and customer base',
    members: 18,
    documents: 67,
    searches: 743,
    color: 'bg-purple-500',
    avatar: '📈',
    lead: 'Emily Rodriguez',
    recentActivity: 'Campaign performance report',
    tags: ['Content', 'Social', 'SEO', 'Analytics']
  },
  {
    id: 4,
    name: 'Sales',
    description: 'Driving revenue and customer success',
    members: 15,
    documents: 45,
    searches: 634,
    color: 'bg-orange-500',
    avatar: '💼',
    lead: 'David Kim',
    recentActivity: 'Q3 sales review',
    tags: ['Enterprise', 'SMB', 'Customer Success']
  },
  {
    id: 5,
    name: 'Design',
    description: 'Creating beautiful and intuitive experiences',
    members: 8,
    documents: 34,
    searches: 521,
    color: 'bg-pink-500',
    avatar: '🎨',
    lead: 'Alex Thompson',
    recentActivity: 'Design system update',
    tags: ['UI/UX', 'Branding', 'Research', 'Prototyping']
  },
  {
    id: 6,
    name: 'Data Science',
    description: 'Extracting insights from data',
    members: 10,
    documents: 78,
    searches: 456,
    color: 'bg-indigo-500',
    avatar: '📊',
    lead: 'Dr. Lisa Wang',
    recentActivity: 'ML model deployment',
    tags: ['Machine Learning', 'Analytics', 'Research']
  }
];

const collaborations = [
  {
    teams: ['Engineering', 'Product'],
    project: 'Mobile App Redesign',
    status: 'active',
    documents: 23
  },
  {
    teams: ['Marketing', 'Sales'],
    project: 'Lead Generation Campaign',
    status: 'active',
    documents: 15
  },
  {
    teams: ['Data Science', 'Product'],
    project: 'User Behavior Analysis',
    status: 'completed',
    documents: 31
  }
];

export default function TeamsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Teams</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Discover teams, expertise, and collaboration opportunities across your organization
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="btn-primary">
                <PlusIcon className="w-4 h-4 mr-2" />
                Create Team
              </button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search teams, skills, or projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>

        {/* Teams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredTeams.map((team, index) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card-hover cursor-pointer"
              onClick={() => setSelectedTeam(team.id)}
            >
              <div className="card-body">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{team.avatar}</div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{team.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Led by {team.lead}</p>
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${team.color}`}></div>
                </div>

                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{team.description}</p>

                <div className="flex flex-wrap gap-1 mb-4">
                  {team.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="badge-secondary text-xs">
                      {tag}
                    </span>
                  ))}
                  {team.tags.length > 3 && (
                    <span className="badge-secondary text-xs">
                      +{team.tags.length - 3}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{team.members}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Members</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{team.documents}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Documents</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{team.searches}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Searches</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Recent: {team.recentActivity}</p>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <button className="btn-ghost btn-sm">
                    <ChatBubbleLeftRightIcon className="w-4 h-4 mr-1" />
                    Connect
                  </button>
                  <button className="btn-ghost btn-sm">
                    <UserPlusIcon className="w-4 h-4 mr-1" />
                    Join
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Collaboration Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card"
        >
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Active Collaborations</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {collaborations.map((collab, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {collab.teams.map((teamName, i) => (
                        <span key={i} className="badge-primary text-xs">
                          {teamName}
                        </span>
                      ))}
                    </div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">{collab.project}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{collab.documents} shared documents</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`badge ${
                      collab.status === 'active' ? 'badge-success' : 'badge-secondary'
                    }`}>
                      {collab.status}
                    </span>
                    <button className="btn-ghost btn-sm">
                      <ChartBarIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Team Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="card text-center"
          >
            <div className="card-body">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserGroupIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Cross-Team Connections</h4>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">847</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">This month</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="card text-center"
          >
            <div className="card-body">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <DocumentTextIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Shared Knowledge</h4>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">1,234</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Documents shared</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="card text-center"
          >
            <div className="card-body">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChartBarIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Collaboration Score</h4>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">92%</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Organization wide</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}