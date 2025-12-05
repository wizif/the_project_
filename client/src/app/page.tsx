'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle, Users, BarChart3, Code2, Zap, Shield } from 'lucide-react';
import Link from 'next/link';
import LiquidChrome from '../components/LiquidChrome';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  const features = [
    {
      icon: Code2,
      title: 'Smart Task Management',
      description: 'AI-powered task creation and priority management for developers'
    },
    {
      icon: Users,
      title: 'Developer Collaboration',
      description: 'Real-time collaboration with code snippets and technical discussions'
    },
    {
      icon: BarChart3,
      title: 'Performance Analytics',
      description: 'Deep insights into team velocity and project metrics'
    }
  ];

  const views = [
    {
      icon: '🎯',
      title: 'Kanban Board',
      description: 'Drag-and-drop sprint planning',
      gradient: 'from-primary-500/20 to-primary-300/20'
    },
    {
      icon: '📊',
      title: 'Table View',
      description: 'Detailed task breakdown',
      gradient: 'from-success/20 to-success-dark/20'
    },
    {
      icon: '📅',
      title: 'Timeline',
      description: 'Visual project roadmap',
      gradient: 'from-accent-500/20 to-accent-700/20'
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-dark-bg">
      {/* Liquid Chrome Animated Background */}
      <div className="absolute inset-0 z-0">
        <LiquidChrome />
      </div>

      {/* Gradient Overlay for depth */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-dark-bg/60 via-transparent to-dark-bg/80 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-white/80 dark:bg-dark-secondary/80 backdrop-blur-xl border-b border-gray-200 dark:border-dark-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/50">
                <Code2 className="text-white" size={22} strokeWidth={2.5} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                DevFlow
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-5 py-2 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-all hover:shadow-lg shadow-primary-500/50"
              >
                Get Started
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="text-center mb-20">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 border border-primary-500/30 rounded-full mb-8 backdrop-blur-sm">
              <Zap size={16} className="text-primary-400" />
              <span className="text-sm text-primary-300 font-medium">Built for Modern Development Teams</span>
            </div>

            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-white drop-shadow-lg">
              Ship Code Faster
              <br />
              <span className="text-primary-400">
                With DevFlow
              </span>
            </h2>
            
            <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
              The ultimate project management platform designed for developers. 
              Track sprints, manage tasks, and ship features with confidence.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="group flex items-center gap-2 px-8 py-4 bg-primary-600 text-white rounded-xl hover:bg-primary-700 hover:shadow-xl shadow-lg shadow-primary-500/50 font-semibold text-lg transition-all hover:scale-105"
              >
                Start Free Trial
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 border-2 border-primary-500/50 text-primary-300 rounded-xl hover:bg-primary-500/10 hover:border-primary-400 font-semibold text-lg transition-all backdrop-blur-sm"
              >
                Sign In
              </Link>
            </div>

            {/* Trust Badge */}
            <div className="flex items-center justify-center gap-2 mt-8 text-sm text-gray-400">
              <Shield size={16} className="text-success" />
              <span>Trusted by 10,000+ development teams worldwide</span>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const colors = [
                'bg-primary-600',
                'bg-success',
                'bg-accent-600'
              ];
              const shadows = [
                'shadow-primary-500/50',
                'shadow-success/50',
                'shadow-accent-500/50'
              ];
              return (
                <div
                  key={feature.title}
                  className="group bg-white/70 dark:bg-dark-secondary/70 backdrop-blur-xl rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all hover:scale-105 border border-white/20 dark:border-dark-border"
                >
                  <div className={`w-14 h-14 ${colors[index]} rounded-xl flex items-center justify-center mb-5 shadow-lg ${shadows[index]} group-hover:shadow-xl transition-all`}>
                    <Icon className="text-white" size={28} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>

          {/* Views Preview */}
          <div className="bg-white/70 dark:bg-dark-secondary/70 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-white/20 dark:border-dark-border mb-20">
            <div className="text-center mb-12">
              <h3 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
                Multiple Views for Every Workflow
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-lg">Choose the view that matches your team's style</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {views.map((view) => (
                <div
                  key={view.title}
                  className={`group relative overflow-hidden p-8 border-2 border-gray-200 dark:border-dark-border rounded-2xl hover:border-primary-400 dark:hover:border-primary-500 transition-all bg-gradient-to-br ${view.gradient} backdrop-blur-sm hover:scale-105`}
                >
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{view.icon}</div>
                  <h4 className="font-bold text-xl mb-2 text-gray-900 dark:text-white">{view.title}</h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    {view.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-gradient-to-br from-primary-900/30 via-primary-800/20 to-accent-900/30 backdrop-blur-xl rounded-3xl p-12 border border-primary-500/30 shadow-2xl shadow-primary-500/10">
            <h3 className="text-4xl font-bold mb-4 text-white">Ready to Transform Your Workflow?</h3>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of teams shipping better software with DevFlow
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-10 py-5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 hover:shadow-2xl shadow-lg shadow-primary-500/50 font-bold text-lg transition-all hover:scale-105"
            >
              Create Free Account
              <ArrowRight size={22} />
            </Link>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white/70 dark:bg-dark-secondary/70 backdrop-blur-xl border-t border-gray-200 dark:border-dark-border mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              &copy; 2025 DevFlow. Built with Next.js, TypeScript, and MongoDB.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Empowering developers to build amazing things
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}