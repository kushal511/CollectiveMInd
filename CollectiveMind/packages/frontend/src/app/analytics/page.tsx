'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  UsersIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  EyeIcon,
  ShareIcon
} from '@heroicons/react/24/outline';

const stats = [
  {
    name: 'Total Searches',
    value: '12,847',
    change: '+12%',
    changeType: 'increase',
    icon: MagnifyingGlassIcon,
  },
  {
    name: 'Active Users',
    value: '2,847',
    change: '+8%',
    changeType: 'increase',
    icon: UsersIcon,
  },
  {
    name: 'Documents Indexed',
    value: '45,231',
    change: '+23%',
    changeType: 'increase',
    icon: DocumentTextIcon,
  },
  {
    name: 'Avg. Response Time',
    value: '0.8s',
    change: '-15%',
    changeType: 'decrease',
    icon: ClockIcon,
  },
];

const topQueries = [
  { query: 'customer churn analysis', count: 234, trend: 'up' },
  { query: 'machine learning models', count: 189, trend: 'up' },
  { query: 'quarterly reports', count: 156, trend: 'down' },
  { query: 'team collaboration', count: 143, trend: 'up' },
  { query: 'product roadmap', count: 128, trend: 'stable' },
];

const teamActivity = [
  { team: 'Engineering', searches: 1247, documents: 89, color: 'bg-blue-500' },
  { team: 'Product', searches: 892, documents: 67, color: 'bg-green-500' },
  { team: 'Marketing', searches: 743, documents: 45, color: 'bg-purple-500' },
  { team: 'Sales', searches: 634, documents: 34, color: 'bg-orange-500' },
  { team: 'Design', searches: 521, documents: 28, color: 'bg-pink-500' },
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Analytics Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Track usage patterns and measure the impact of your organizational memory
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="input"
              >
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card"
            >
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                  </div>
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">vs last period</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Queries */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="card"
          >
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Top Search Queries</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {topQueries.map((item, index) => (
                  <div key={item.query} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.query}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.count} searches</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <ArrowTrendingUpIcon className={`w-4 h-4 ${
                        item.trend === 'up' ? 'text-green-500' : 
                        item.trend === 'down' ? 'text-red-500' : 'text-gray-400'
                      }`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Team Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="card"
          >
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Team Activity</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {teamActivity.map((team, index) => (
                  <div key={team.team} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${team.color}`}></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{team.team}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {team.searches} searches • {team.documents} documents
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{team.searches}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Usage Patterns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card mt-8"
        >
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Usage Patterns</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <EyeIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Peak Hours</h4>
                <p className="text-gray-600 dark:text-gray-400">9 AM - 11 AM</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">Most active search period</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShareIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Collaboration</h4>
                <p className="text-gray-600 dark:text-gray-400">847 connections</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">Cross-team discoveries</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ChartBarIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Efficiency</h4>
                <p className="text-gray-600 dark:text-gray-400">23% faster</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">Information discovery</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}