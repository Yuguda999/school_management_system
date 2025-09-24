import React from 'react';
import { Link } from 'react-router-dom';
import {
  AcademicCapIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  DevicePhoneMobileIcon,
  CheckIcon,
  SparklesIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const LandingPage: React.FC = () => {
  const features = [
    {
      name: 'Student Management',
      description: 'Complete student information system with enrollment, attendance, and academic records',
      icon: AcademicCapIcon,
    },
    {
      name: 'Teacher Portal',
      description: 'Dedicated portal for teachers to manage classes, assignments, and student progress',
      icon: UserGroupIcon,
    },
    {
      name: 'Fee Management',
      description: 'Automated fee collection, payment tracking, and financial reporting',
      icon: CurrencyDollarIcon,
    },
    {
      name: 'Communication Tools',
      description: 'SMS and email notifications to keep parents and students informed',
      icon: ChatBubbleLeftRightIcon,
    },
    {
      name: 'Reports & Analytics',
      description: 'Comprehensive reporting and analytics for data-driven decision making',
      icon: ChartBarIcon,
    },
    {
      name: 'Mobile Access',
      description: 'Mobile-responsive design for access from any device, anywhere',
      icon: DevicePhoneMobileIcon,
    },
  ];

  const pricingPlans = [
    {
      name: 'Free Trial',
      price: 'Free',
      period: '30 days',
      description: 'Perfect for getting started',
      features: [
        'Up to 100 students',
        'Up to 10 teachers',
        'Up to 20 classes',
        'All premium features',
        'Email support',
        'No credit card required'
      ],
      cta: 'Start Free Trial',
      href: '/register',
      popular: true,
    },
    {
      name: 'Starter',
      price: '$29',
      period: 'month',
      description: 'For small schools',
      features: [
        'Up to 100 students',
        'Up to 10 teachers',
        'Basic features',
        'Email support',
        'Monthly reports'
      ],
      cta: 'Choose Starter',
      href: '/register',
      popular: false,
    },
    {
      name: 'Professional',
      price: '$79',
      period: 'month',
      description: 'For growing schools',
      features: [
        'Up to 500 students',
        'Up to 50 teachers',
        'Advanced features',
        'Priority support',
        'Custom reports',
        'API access'
      ],
      cta: 'Choose Professional',
      href: '/register',
      popular: false,
    },
  ];

  const testimonials = [
    {
      content: "This platform has transformed how we manage our school. The efficiency gains are remarkable!",
      author: "Dr. Sarah Johnson",
      role: "Principal, Greenwood High School",
    },
    {
      content: "The reporting features give us insights we never had before. Highly recommended!",
      author: "Michael Chen",
      role: "Administrator, Riverside Academy",
    },
    {
      content: "Outstanding customer support and a platform that grows with our needs.",
      author: "Fatima Al-Rashid",
      role: "Director, International School of Excellence",
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Modern School Management
              <span className="block text-blue-600">Made Simple</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Streamline your school operations with our comprehensive management platform. 
              Start your free 30-day trial today - no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <SparklesIcon className="mr-2 h-5 w-5" />
                Start Free Trial
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center px-8 py-4 border border-gray-300 dark:border-gray-600 text-lg font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Sign In
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              ✨ 30-day free trial • No credit card required • Cancel anytime
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need to Manage Your School
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Our comprehensive platform includes all the tools you need to run your school efficiently.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.name} className="text-center p-6">
                <div className="flex justify-center mb-4">
                  <feature.icon className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="py-24 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Start with a free trial, then choose the plan that fits your school's needs.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 ${
                  plan.popular ? 'ring-2 ring-blue-600 scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {plan.price}
                    </span>
                    <span className="text-gray-600 dark:text-gray-300">/{plan.period}</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">{plan.description}</p>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center">
                      <CheckIcon className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={plan.href}
                  className={`block w-full text-center py-3 px-6 rounded-lg font-medium transition-colors ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Trusted by Schools Worldwide
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              See what educators are saying about our platform.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
                  "{testimonial.content}"
                </p>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {testimonial.author}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your School?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of schools already using our platform. Start your free trial today.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-blue-600 bg-white hover:bg-gray-50 transition-colors"
          >
            <SparklesIcon className="mr-2 h-5 w-5" />
            Start Your Free Trial
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400">
              © 2024 School Management Platform. All rights reserved.
            </p>
            <div className="mt-4 space-x-6">
              <Link to="/login" className="text-gray-400 hover:text-white">
                Sign In
              </Link>
              <Link to="/register" className="text-gray-400 hover:text-white">
                Register
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
