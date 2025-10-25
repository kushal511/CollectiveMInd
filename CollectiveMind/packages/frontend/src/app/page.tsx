'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  SparklesIcon, 
  UserGroupIcon,
  ChartBarIcon,
  LightBulbIcon,
  ArrowRightIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search page with query
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const features = [
    {
      icon: MagnifyingGlassIcon,
      title: 'Hybrid Search',
      description: 'Combine keyword matching with semantic similarity for precise, contextual results across all your organizational content.',
      color: 'from-primary-500 to-primary-600'
    },
    {
      icon: SparklesIcon,
      title: 'AI-Powered Insights',
      description: 'Get intelligent summaries, discover hidden connections, and receive personalized recommendations powered by Vertex AI.',
      color: 'from-accent-500 to-accent-600'
    },
    {
      icon: UserGroupIcon,
      title: 'Cross-Team Discovery',
      description: 'Automatically detect collaboration opportunities and connect with experts across different teams and departments.',
      color: 'from-success-500 to-success-600'
    },
    {
      icon: ChartBarIcon,
      title: 'Smart Analytics',
      description: 'Track knowledge usage patterns, measure collaboration impact, and optimize your organizational memory.',
      color: 'from-warning-500 to-warning-600'
    },
    {
      icon: LightBulbIcon,
      title: 'Serendipity Engine',
      description: 'Discover unexpected insights and connections that spark innovation and drive breakthrough thinking.',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: UserGroupIcon,
      title: 'Personalized Experience',
      description: 'Tailored content recommendations based on your role, team membership, and individual interests.',
      color: 'from-blue-500 to-blue-600'
    }
  ];

  const personas = [
    {
      name: 'Maya',
      role: 'Product Manager',
      avatar: '👩‍💼',
      scenario: 'Discovering customer churn insights and connecting with Marketing team',
      color: 'bg-gradient-to-r from-pink-500 to-rose-500'
    },
    {
      name: 'Rahul',
      role: 'Marketing Analyst',
      avatar: '👨‍💻',
      scenario: 'Finding cross-team collaboration opportunities and avoiding duplicate work',
      color: 'bg-gradient-to-r from-blue-500 to-indigo-500'
    },
    {
      name: 'Priya',
      role: 'New Hire',
      avatar: '👩‍🎓',
      scenario: 'Getting onboarded with AI guidance and team-specific resources',
      color: 'bg-gradient-to-r from-green-500 to-emerald-500'
    }
  ];

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-primary-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-20 pb-32">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-8"
            >
              <SparklesIcon className="w-4 h-4 mr-2" />
              Powered by Elastic + Vertex AI
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="gradient-text">CollectiveMind</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              Your organizational memory platform that transforms how teams discover, 
              connect, and collaborate through intelligent search and AI-powered insights.
            </p>

            {/* Search Preview */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="search-container mb-12"
            >
              <form onSubmit={handleSearch} className="relative">
                <MagnifyingGlassIcon className="search-icon" />
                <input
                  type="text"
                  placeholder="Search for customer churn analysis..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch(e);
                    }
                  }}
                />
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 btn-primary btn-lg"
                >
                  Search
                </motion.button>
              </form>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="flex flex-col sm:flex-row justify-center gap-4"
            >
              <Link href="/search" className="btn-primary btn-lg group">
                Start Exploring
                <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/chat" className="btn-secondary btn-lg group">
                <SparklesIcon className="w-5 h-5 mr-2" />
                Try AI Chat
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Intelligent Knowledge Discovery
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Harness the power of hybrid search and AI to unlock your organization's collective intelligence
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                className="card-hover group"
              >
                <div className="card-body">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Personas Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-primary-50/30 dark:from-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Built for Every Role
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Experience personalized workflows designed for different roles and use cases
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {personas.map((persona, index) => (
              <motion.div
                key={persona.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                viewport={{ once: true }}
                className="card-hover group cursor-pointer"
              >
                <div className="card-body text-center">
                  <div className={`w-16 h-16 rounded-full ${persona.color} flex items-center justify-center text-2xl mb-4 mx-auto group-hover:scale-110 transition-transform duration-200`}>
                    {persona.avatar}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {persona.name}
                  </h3>
                  <div className="badge-primary mb-4">
                    {persona.role}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {persona.scenario}
                  </p>
                  <motion.div
                    className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <span className="text-primary-600 font-medium text-sm">
                      Try {persona.name}'s workflow →
                    </span>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Transform Your Organization?
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Join the future of organizational knowledge management with CollectiveMind
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/search" className="btn bg-white text-primary-600 hover:bg-gray-50 btn-lg">
                Start Your Journey
              </Link>
              <Link href="/chat" className="btn bg-primary-500 hover:bg-primary-400 text-white btn-lg">
                Try AI Assistant
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}