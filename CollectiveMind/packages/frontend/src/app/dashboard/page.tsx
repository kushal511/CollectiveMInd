'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  SparklesIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  ClockIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightIcon,
  CalendarIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface DashboardCard {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ComponentType<any>;
  color: string;
}

interface Insight {
  id: string;
  type: 'opportunity' | 'alert' | 'suggestion';
  title: string;
  description: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  team?: string;
}

interface RecentActivity {
  id: string;
  type: 'document' | 'message' | 'meeting';
  title: string;
  author: string;
  team: string;
  timestamp: string;
  relevance: number;
}

const dashboardCards: DashboardCard[] = [
  {
    title: 'Customer Churn Rate',
    value: '15.2%',
    change: '+2.3%',
    trend: 'down',
    icon: TrendingDownIcon,
    color: 'from-red-500 to-red-600'
  },
  {
    title: 'Cross-Team Collaborations',
    value: '23',
    change: '+12%',
    trend: 'up',
    icon: UserGroupIcon,
    color: 'from-green-500 to-green-600'
  },
  {
    title: 'Knowledge Discoveries',
    value: '156',
    change: '+8%',
    trend: 'up',
    icon: LightBulbIcon,
    color: 'from-blue-500 to-blue-600'
  },
  {
    title: 'Active Documents',
    value: '89',
    change: '+5%',
    trend: 'up',
    icon: DocumentTextIcon,
    color: 'from-purple-500 to-purple-600'
  }
];

const insights: Insight[] = [
  {
    id: '1',
    type: 'opportunity',
    title: 'Marketing-Product Alignment Opportunity',
    description: 'Strong overlap detected between your churn analysis and Rahul\'s retention campaign data. Collaboration could yield 25% better results.',
    action: 'Schedule sync meeting',
    priority: 'high',
    team: 'Marketing'
  },
  {
    id: '2',
    type: 'alert',
    title: 'Churn Rate Trending Up',
    description: 'Customer churn has increased 15% this quarter. Engineering team has similar concerns about user experience.',
    action: 'Review with Engineering',
    priority: 'high',
    team: 'Engineering'
  },
  {
    id: '3',
    type: 'suggestion',
    title: 'Knowledge Gap Identified',
    description: 'Multiple teams are asking about pricing strategy. Consider creating a shared knowledge base.',
    action: 'Create shared doc',
    priority: 'medium'
  }
];

const recentActivity: RecentActivity[] = [
  {
    id: '1',
    type: 'document',
    title: 'Customer Retention Strategy Q4',
    author: 'Rahul Sharma',
    team: 'Marketing',
    timestamp: '2 hours ago',
    relevance: 95
  },
  {
    id: '2',
    type: 'message',
    title: 'Discussion: Churn prevention tactics',
    author: 'Alex Johnson',
    team: 'Engineering',
    timestamp: '4 hours ago',
    relevance: 87
  },
  {
    id: '3',
    type: 'document',
    title: 'User Experience Improvements',
    author: 'Sarah Kim',
    team: 'Design',
    timestamp: '1 day ago',
    relevance: 82
  },
  {
    id: '4',
    type: 'meeting',
    title: 'Product Roadmap Review',
    author: 'Maya Chen',
    team: 'Product',
    timestamp: '2 days ago',
    relevance: 78
  }
];

export default function DashboardPage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return LightBulbIcon;
      case 'alert': return ExclamationTriangleIcon;
      case 'suggestion': return SparklesIcon;
      default: return SparklesIcon;
    }
  };

  const getInsightColor = (type: string, priority: string) => {
    if (priority === 'high') {
      return type === 'alert' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50';
    }
    return 'border-blue-200 bg-blue-50';
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'document': return DocumentTextIcon;
      case 'message': return ChatBubbleLeftRightIcon;
      case 'meeting': return CalendarIcon;
      default: return DocumentTextIcon;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, Maya! 👋
              </h1>
              <p className="text-gray-600">
                Here's what's happening in your organizational knowledge network
              </p>
            </div>
            
            <div className="mt-4 md:mt-0 flex items-center space-x-3">
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="input text-sm"
              >
                <option value="1d">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <button className="btn-primary">
                <BellIcon className="w-4 h-4 mr-2" />
                Notifications
              </button>
            </div>
          </div>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {dashboardCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className="card-hover"
            >
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${card.color} flex items-center justify-center`}>
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className={`flex items-center text-sm font-medium ${
                    card.trend === 'up' ? 'text-green-600' : 
                    card.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {card.trend === 'up' ? (
                      <TrendingUpIcon className="w-4 h-4 mr-1" />
                    ) : card.trend === 'down' ? (
                      <TrendingDownIcon className="w-4 h-4 mr-1" />
                    ) : null}
                    {card.change}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{card.value}</h3>
                <p className="text-sm text-gray-600">{card.title}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* AI Insights */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="lg:col-span-2"
          >
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <SparklesIcon className="w-5 h-5 text-primary-600 mr-2" />
                    <h2 className="text-lg font-semibold text-gray-900">AI Insights & Opportunities</h2>
                  </div>
                  <Link href="/insights" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    View all
                  </Link>
                </div>
              </div>
              
              <div className="card-body space-y-4">
                {insights.map((insight, index) => {
                  const IconComponent = getInsightIcon(insight.type);
                  return (
                    <motion.div
                      key={insight.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.4 }}
                      className={`p-4 rounded-lg border-2 ${getInsightColor(insight.type, insight.priority)} hover:shadow-md transition-all duration-200`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <IconComponent className="w-5 h-5 text-gray-600 mr-2 flex-shrink-0" />
                          <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                        </div>
                        <div className="flex items-center space-x-2">
                          {insight.team && (
                            <span className="badge-secondary text-xs">{insight.team}</span>
                          )}
                          <span className={`badge text-xs ${
                            insight.priority === 'high' ? 'badge-error' :
                            insight.priority === 'medium' ? 'badge-warning' : 'badge-secondary'
                          }`}>
                            {insight.priority}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                        {insight.description}
                      </p>
                      <button className="btn-primary btn-sm group">
                        {insight.action}
                        <ArrowRightIcon className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                  <Link href="/activity" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    View all
                  </Link>
                </div>
              </div>
              
              <div className="card-body space-y-4">
                {recentActivity.map((activity, index) => {
                  const IconComponent = getActivityIcon(activity.type);
                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.4 }}
                      className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer group"
                    >
                      <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors duration-200 truncate">
                          {activity.title}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500">{activity.author}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="badge-secondary text-xs">{activity.team}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center text-xs text-gray-500">
                            <ClockIcon className="w-3 h-3 mr-1" />
                            {activity.timestamp}
                          </div>
                          <div className="text-xs text-primary-600 font-medium">
                            {activity.relevance}% relevant
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-8"
        >
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/search?q=customer+churn" className="btn-secondary group flex items-center justify-center p-4">
                  <ChartBarIcon className="w-5 h-5 mr-2" />
                  Analyze Churn Data
                  <ArrowRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/chat" className="btn-secondary group flex items-center justify-center p-4">
                  <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
                  Ask AI Assistant
                  <ArrowRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/teams" className="btn-secondary group flex items-center justify-center p-4">
                  <UserGroupIcon className="w-5 h-5 mr-2" />
                  Connect with Teams
                  <ArrowRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}